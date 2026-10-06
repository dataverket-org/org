# Notater

Notater fra utforsking som gjelder Dataverket som helhet: produktene, leietakermodellen, valg av programvare og
hvordan delene passer sammen. Det som bare gjelder ett depot, slik som driften av fabrikk-infra-klyngen eller
fabrikken selv, ligger i det depotets egen `docs/research/`.

Notatene er skrevet i LLM-økter. En person har stilt spørsmålene og lest svarene, og det som står her er det
økten kom fram til, ordnet og lagret slik det ble sagt. Les dem slik: som et godt forberedt innspill, med kilder
der de finnes, og ikke som en beslutning. Hvert notat sier hva som er lest fra dokumentasjon og hva som er prøvd,
og lister det som gjenstår å bevise. En beslutning tas i det depotet som eier saken, og peker tilbake hit.

Notatene er på engelsk, slik øktene var. Filnavnet begynner med året og måneden notatet ble skrevet, der det er
kjent.

| Notat | Handler om |
|---|---|
| [idm-sovereignty-notes.md](idm-sovereignty-notes.md) | Skybytte, IAM og suverenitet: hvorfor innlåsingen sitter i identitetsmodellen og autorisasjonen, ikke i infrastrukturen, og hvordan Dataverket svarer på det |
| [2026-10-s3-gateways-one-code-path.md](2026-10-s3-gateways-one-code-path.md) | En versitygw-konto ved siden av en RadosGW-bruker, hvorfor bucket-listing er Objekts sak og ikke en policy, og hvilke deler av policy og STS én kodesti kan betjene på begge gatewayer |
| [2026-10-rendered-artifacts-for-the-products.md](2026-10-rendered-artifacts-for-the-products.md) | Hva ferdig rendrede, signerte artefakter betyr for Sentral, Identitet, Maskin og Plattform |
