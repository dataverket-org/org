# Research: rendered, signed artifacts and what they mean for the products

Written 2026-10-01 in an LLM session, as the last part of a report on shipping rendered manifests as OCI
artifacts; moved here 2026-10-06 because it is about Dataverket's products and not about one cluster. The report
itself, with the pattern, the chart processor, the handling of secrets and what changes for the cluster that runs
it, is `docs/research/2026-10-rendered-manifests-over-oci.md` in fabrikk-infra, and the toolchain proposed for it is
`docs/research/2026-10-render-toolchain.md` there. The pattern in one line: `release = render(L1 @ commit, L2 @
version)`, pinned by digest, signed, applied by Flux from a registry, never joined in the cluster.

## What follows for each product

**The Talos control plane without Omni.** Machine configs are rendered from patch files. Flux and its one pointer
can be an inline manifest in that config, so a new cluster starts delivering by itself: no `flux bootstrap`, no
forge token, no generated Flux YAML in git.

**Sentral and Identitet.** Both are upstream software with Dataverket code around it, so the processor is how
their L1 is made. The Zitadel in the fabrikk-infra cluster is in practice Identitet's first deployment and the
first recipe. The cluster that runs Identitet also stops needing the forge, which logs in through Identitet.

**Maskin.** A machine that boots Talos by iPXE needs a registry within reach, not a forge. `flux mirror` lets each
operator in the samvirke copy Dataverket's signed artifacts into its own registry, check them, and promote on its
own schedule: shared code, each operator's own trust boundary.

**Plattform.** Customer clusters would run the baseline the fabrikk-infra cluster runs, so that cluster is the
first user, and the processor becomes something customers can use for their own charts. The open problem is scale:
"never join in the cluster" means one render per cluster. Either the baseline holds no per-cluster facts, or
rendering per cluster becomes a service Plattform runs and signs with. The second is a product feature and a
signing authority, and should be chosen deliberately, before Plattform designs on top of it.

## The decision this leaves open

Who signs. With verification on, whoever signs decides what a cluster runs. A key on the operators' YubiKeys keeps
every baseline change a deliberate act; a process key makes it unattended and puts cluster admin in a file. The
same question returns, larger, when Plattform renders and signs for customers.
