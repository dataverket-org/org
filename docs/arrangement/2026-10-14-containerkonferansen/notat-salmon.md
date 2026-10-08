# Salmon, read for the Containerkonferansen talk

Notes for Linus. Written 8 October 2026 from a full read of
`codeberg.org/eskpil/salmon` at HEAD `d91247c` (15 commits, 30 August to
3 September, one author). `go build`, `go vet` and `go test` all pass on
Go 1.27.1. References are `file.go:line`.

**The short version.** Salmon has the shape the talk abstract asks for: its own
issuer, its own signing key, its own JWKS, and two federation paths already in
code (humans from Zitadel or LDAP, workloads from a cluster's OIDC issuer via
RFC 8693). The token exchange is real and the core is hand-written and
readable. What it issues today is an identity, not a principal: the token says
"workload X exists" and nothing more. The delegation parts of RFC 8693 are
parsed but not used. There are two small bugs and one missing file to fix
before the 14th. Below, in order: what works, what the token holds, what RFC
8693 is missing, bugs, hardening, what Dataverket's NATS auth callout would
need, what we suggest showing on stage, and the questions we would ask each
other.

## What works

- Humans sign in through an external OIDC or LDAP provider and get a Salmon
  identity (`externalidp/oidc.go`, `externalidp/ldap.go`). As an OIDC client
  Salmon does state, nonce and PKCE correctly (`oidc.go:166-308`).
- Workloads send a JWT they already have, for example a projected
  ServiceAccount token, to `POST /issuer/token` with
  `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`
  (`issuer/oauth2.go:89-182`). No client secret; `client_id` is the workload
  UUID. Same model as Azure workload identity, and `schema/workload.go:28-31`
  says so.
- Trust is one row. The incoming `iss` and `sub` are read unverified, then
  matched against a `Credential` of type `oidc` on that workload
  (`internal/credentials/credentials.go:11-17`). Then discovery and JWKS are
  fetched from the issuer, cached five minutes (`issuer/jwks_cache.go`), and
  the signature and `exp` are checked.
- Tokens are Ed25519, `typ: at+jwt`, 15 minutes, JWS written by hand
  (`issuer/mint.go:138-210`). JWKS at `/issuer/keys`, discovery at
  `/issuer/.well-known/openid-configuration`.
- `cmd/verify` is the recipe a service follows: read `iss`, fetch discovery
  and JWKS, verify. Services trust Salmon, not Zitadel or kube-apiserver.
- Cedar is the policy language (`internal/accesspolicies`), same as
  Dataverket. OpenTelemetry on gorm and chi (`pkg/otel`). Client secrets and
  session cookies stored as digests. The OAuth2 error layer separates fatal
  errors from redirectable ones with correct status codes
  (`issuer/oauth2/error.go`).

## What the token holds

`issuer/mint.go:164-172`, the whole access token:

```go
claims := map[string]any{
    "iss": issuerURL,
    "sub": sub.Subject(),
    "aud": []string{issuerURL}, // TODO: resource indicators, RFC 8707
    "iat": now.Unix(),
    "nbf": now.Unix(),
    "exp": now.Add(ttl).Unix(),
    "jti": jti,
}
```

For a workload `sub` is the Salmon UUID, not `system:serviceaccount:...`.
`aud` is always Salmon itself. There is no `team`, `roles`, `scope`,
`client_id` or `act`. `Workload.Roles()` returns an empty list
(`schema/workload.go:48-50`), so there is no source of roles for workloads
at all. `cmd/verify` has to pass `SkipClientIDCheck` because no service has
an audience of its own to require. An older example token in
`cmd/verify/main.go:27` still has `client_id` and `scope`, so they were there
once.

`issuerURL` is a constant, `http://localhost:8080/issuer/`
(`issuer/issuer.go:20`). Everything downstream needs this to be
configuration.

## RFC 8693, parsed but not used

All of these are defined in `issuer/oauth2/token.go` and never read in
`issuer/oauth2.go`: `audience`, `resource`, `requested_token_type`,
`actor_token`, `actor_token_type`. The response always says
`issued_token_type=access_token` (`oauth2.go:216`). `scope` only decides
whether an ID token is issued; it does not land in the token. None of the
section 4 claims exist: `act`, `scope`, `client_id`, `may_act`. Only
`subject_token_type=jwt` is accepted.

The one that matters for the talk is `act`. Delegation that keeps the human
means: human token as `subject_token`, workload token as `actor_token`,
verify both, issue `sub=human, act={sub: workload}`. Today `subject_token`
must match a `Credential` row on a `Workload`, a human has no such row, and
Salmon does not accept its own tokens as input. That is the biggest model
change, and it is honest to say so on stage.

## Bugs to fix before the talk

1. **Authorization code can be redeemed more than once.** The conditional
   update at `issuer/oauth2.go:326-328` sets `stage` from `code_issued` to
   `code_issued`, so it matches every time within the ten minutes.
   `schema.AuthStageExchanged` is defined (`schema/authrequest.go:15`) and
   never used. One-word fix.
2. **Unknown `kid` panics.** `jwks.Key(kid)[0]` at `oauth2.go:148` indexes
   an empty slice when the key id is not in the cached set. `net/http`
   recovers and drops the connection. This is what happens after
   kube-apiserver rotates keys inside the five-minute cache window. Check
   the length, and refetch on miss.
3. **No LICENSE file.** The talk has "open source" in the title and
   Dataverket is AGPL. Pick one and commit it.

## Hardening, for later

Not for the stage, but you should know we saw them: incoming `aud` and `nbf`
are not checked (a ServiceAccount token minted for `aud=kubernetes` can be
replayed to Salmon; `kubectl create token --audience=<salmon>` plus a check
closes it); the dashboard always sets `InsecureSkipVerify`
(`dashboard/credentials.go:102`); `nonce` on `/authorize` is parsed but not
stored (`oauth2.go:404`), so Salmon never echoes it; the dashboard callback
ignores `code` and `state` (`dashboard/internal_callback.go:10-35`); one key
on local disk with a fixed `kid` and no rotation; nothing is revocable, not
even `Session.RevokedAt`; `AutoMigrate` at startup; secrets in `salmon.yaml`
in clear text. One test file in 26 packages (`issuer/eddsa_test.go`).

Dead code: root `team.go` (`Role`, `RoleBinding`, `Offer`) is imported by
nothing, `issuer/jwk.go` is unused, `internal/apps/secret.go` is empty.

## What Dataverket's auth callout needs

NATS auth callout gets a token, builds a principal from the claims, maps the
org to a NATS account, and asks Cedar which subjects it may publish and
subscribe to. No lookups on the hot path. For a Salmon token to work there:

1. Configurable `iss`, a public `https://` URL.
2. `team` (or `org`), `roles` and `client_id` in the token.
3. `audience` honoured, with an allowlist per workload, so `aud` is the
   callout and not Salmon.
4. `act` and `actor_token` for delegation.
5. Key rotation with an overlap period, and storage that two replicas can
   share.
6. An answer to lifetime: tokens live 15 minutes, NATS connections live
   hours. Either the callout forces reconnect at `exp`, or we accept that
   access lasts until the next reconnect.

Team is the only grouping and all teams share one issuer and key. Whether
Team equals org in Dataverket is a question for the stage, not for this
note.

## What we suggest you show

Ten to twelve minutes, four to six slides.

1. **Why another IdP.** The comment at `schema/workload.go:10-16`: IdPs are
   built for humans and do not fully implement RFC 8693. This is the bridge
   from Jan Ivar's part, which ends on Zitadel only exchanging its own tokens.
2. **The model.** Team owns App, Workload, Service. App has a `secret`
   credential, Workload has an `oidc` credential with `{issuer, subject}`.
   The credential is a trust relationship, not a secret Salmon handed out.
3. **The exchange, as a sequence diagram.** Pod gets SA token, posts it to
   `/issuer/token`, Salmon matches the row, fetches JWKS, verifies, mints.
   Service verifies against `/issuer/keys`.
4. **Two snippets.** `credentials.go:11-17`, "trust is a row", and
   `mint.go:164-172`, "this is everything the token knows". The TODO on
   `aud` is the handover back.
5. **What is missing, plainly.** The RFC 8693 table above, PKCE and
   refresh, one key, one test. The numbers: 6 322 lines of Go, 15 commits,
   five days, one person, Claude on the HTML and the error catalogue. The
   honesty is what makes the proof credible.
6. **Next step is NATS.** The six-item list above, as the invitation to the
   room.

## Questions for the Q&A

Jan Ivar to Linus:

- The token says only "workload X exists". Where is the line between what
  Salmon puts in the token and what the receiver decides with its own Cedar
  policy? What is the smallest set of claims you want in?
- You chose exact (`iss`, `sub`) per workload over trusting a whole issuer.
  What happens with four hundred ServiceAccounts: namespace selectors,
  SPIFFE, or many rows?
- `actor_token` is parsed and dropped. How would Salmon accept a human token
  as `subject_token` when the model requires it to point at a Workload? And
  who gets to ask, that is `may_act`?
- Why Ed25519 over RS256 when not every verifier supports it, and what is
  the rotation plan with two replicas?

Linus to Jan Ivar:

- Which claims does the callout require as a minimum, and will it accept
  `aud` equal to the STS, or must Salmon set a NATS-specific `aud`?
- Dataverket maps org to NATS account. Salmon has Team. Is Team your org, or
  do you need a hierarchy in the token, and whose job is it to express it?
- If services never verify Zitadel tokens directly, who is "the user": the
  Zitadel `sub`, the STS `sub`, or something else? What if the same human
  arrives through another issuer tomorrow?
- Fifteen-minute tokens and connections that live for hours: does the
  callout force re-authentication at `exp`, or does access last until
  reconnect? Does Salmon need revocation at all, then?
