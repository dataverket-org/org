# Cloud switching, IAM, and sovereignty

Working notes on the switching questions. Written from the perspective of someone who builds control planes for a living: Lock-in mostly lives above the infrastructure: In the API contract, the identity model, and the authorization semantics. Regulation can force the exit door open; but it can't make the other side worth it for a customer to land on.

## IAM: compatibility problems across the alternatives

IAM lock-in is stickier than data lock-in. The "standards exist, so it's solved" framing is practically wrong.

**Authentication is largely solved. Provisioning and authorization are not.** OIDC and SAML federation for login work fine across providers. The problems live one layer down.

**Provisioning: SCIM 2.0 looks like a standard, behaves like a dialect.** It's the nominal answer for cross-provider user and group provisioning, but the implementations aren't interoperable in practice. A SCIM client that works against one server is unlikely to work against another without adaptation, because vendors read the same spec differently. Even Microsoft Entra publishes a documented list of its own SCIM 2.0 non-compliance requiring feature-flag workarounds. SCIM's group-membership model is a well-known anti-pattern, and the fixed User schema rarely fits real needs. So SCIM beats greenfield, but "SCIM-compatible" does not mean "portable."

**The deeper lock-in is authorization semantics.** Every hyperscaler encodes permissions in a proprietary model: AWS IAM policies, Azure RBAC plus Conditional Access, GCP IAM conditions, with no shared language between them. Role definitions, policy-condition syntax, resource scoping, privilege-boundary concepts: none of it maps cleanly. There is no SCIM equivalent for "here is my entire authorization graph, port it." This is where migration cost actually accumulates, and it stays invisible until you try to leave.

**Where we come out on it.** The IDP should belong to the customer, not the cloud. Authorization should be expressed against an open, provider-independent model rather than a vendor's policy dialect. Concretely, a pattern that works:

- Identity authority is an external, self-hostable IDP (Zitadel in our reference cases). Tenants map to orgs in that IDP.

- Tenant isolation in the control plane is derived from those orgs: separate 
messaging accounts (NATS.io) per tenant, so the isolation boundary is structural.

- Authorization decisions run in a messaging-security layer we own, against tokens and claims we define. RFC 8693 token exchange gives delegated, audience-scoped, time-bound access with the human preserved in the `act` claim, so every machine action still traces back to a real person in the audit log.

- Because the model is open and resource addressing is common across installations, an authorization graph is portable between two conformant deployments in a way it fundamentally is not between AWS and Azure.

That last property is the actual answer to IAM compatibility: not a better bilateral migration tool, but a shared open model so moving between conformant systems is close to trivial. This is not hypothetical. FEIDE already does exactly this for Norwegian education: institutions keep their own identity systems and federate access through a common interface, so a user's identity travels across services run by different operators. The same pattern applied to infrastructure and access control is what makes provider switching a non-event. 

EOSC is a second, larger proof: the EU Node is built entirely from open-source components, with a federated identity layer providing single sign-on across services and a shared messaging layer carrying inter-service communication, all designed so independent nodes can interoperate through common interfaces (https://open-science-cloud.ec.europa.eu/about/eosc-eu-node-open-source-code).

A secure message bus plus an integrated IDM, federated across operators, is a pattern the Commission has already funded and put into production. (independent technical ref: Jan Ivar Beddari)

**The message:** mandating SCIM and OIDC support is necessary but not sufficient. The lock-in is in authorization, which no current standard makes portable. Regulators should push for open, portable authorization models and fund open-source integration reference implementations, because the market will not converge these semantics on its own. Customers must own their own users.

