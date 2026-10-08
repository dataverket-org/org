---
title: "Maskiner som logger inn"
description: "Foredrag på Containerkonferansen 2026 om maskinidentitet, delegering og tillit med åpen kildekode. Dataverkets kontrollplan og salmon."
type: event
project: dataverket
date: 2026-10-14
time: "13:05–13:50"
location: "Containerkonferansen 2026, Scandic Lerkendal, Trondheim, Room 2"
event: https://containerkonferansen.no/
lang: nb
tags: [foredrag, containerkonferansen, identitet, kontrollplan, nats, token-exchange]
---

## Om foredraget

| | |
|---|---|
| **Full tittel** | Maskiner som logger inn: maskinidentitet, delegering og tillit med åpen kildekode |
| **Konferanse** | [Containerkonferansen 2026](https://containerkonferansen.no/), 14.–15. oktober 2026 |
| **Tidspunkt** | onsdag 14. oktober 2026, 13:05–13:50 |
| **Sted** | Scandic Lerkendal, Trondheim, Room 2 |
| **Format** | Presentasjon, 45 minutter, to foredragsholdere |
| **Språk** | Norsk |
| **Foredragsholdere** | Jan Ivar Beddari, Dataverket, og Linus Johansen, [salmon](https://codeberg.org/Eskpil/salmon) |
| **Manus** | [foredrag.md](foredrag.md) i samme mappe |

## Sammendrag

Når maskiner kan sies å «tenke» og handle selv, som agenter, orkestratorer og
autonome arbeidslaster, blir et eldre spørsmål viktigere: hvem er denne
maskinen, og på vegne av hvem handler den?

Foredraget bygger på erfaringer fra utvikling av et nytt sikkerhetsfokusert,
hendelsesdrevet kontrollplan for suveren skyinfrastruktur: skrevet i Go,
lisensiert AGPL, med NATS som meldingstjeneste, CloudEvents som
payload-standard og Zitadel som identitetsplattform. Vi deler det vi har lært
så langt og dykker ned i relevante protokoller og systemer.

- Hvordan bygger vi tenant-isolasjon med NATS-kontoer som speiler
  organisasjoner i identitetsplattformen? Kryss-trafikk mellom leietakere må
  være kryptografisk umulig, ikke bare forbudt ved hjelp av policy.
- Hvordan kan vi benytte NATS auth-callout i kontrollplanet til å erstatte
  tradisjonelle credentials med kortlevde JWT-token, slik at statiske
  hemmeligheter ikke må leve lenge eller manuelt roteres?
- Hvordan kan vi kontrollere delegering av rettigheter og maskinhandlinger i
  cluster ved hjelp av RFC 8693? Kan vi bevare sporbarhet til et menneske i
  act-claimet, slik at kommandoer og hendelser kan spores tilbake til en
  person?

Like viktig: hva ser vi som fortsatt mangler i økosystemet? Zitadels token
exchange ble nylig GA, men bytter foreløpig bare Zitadels egne tokens. For oss
betyr det at kontrollplanets token exchange må være sin egen token-utsteder: en
STS med egen iss, egne signeringsnøkler og eget JWKS-endepunkt. STS-en
fødererer identitet fra flere utstedere, Zitadel for mennesker og
tjenestebrukere, og clustrenes innebygde OIDC-utstedere for workload identity.
Tjenester verifiserer mot STS-en, ikke utstederne direkte. Dette er komplisert
infrastruktur alle som trenger delegert maskinidentitet i dag må bygge selv.

Foredraget avsluttes med en konkret ønskeliste til det norske åpen
kildekode-fellesskapet: modne delegeringsprofiler i identitetsplattformer,
standardisert identitet for meldinger, og gjenbrukbare byggeklosser i et
kontrollplan slik at neste utvikler ikke trenger å bygge alt selv. Bli med oss
i Dataverket på veien videre.

## Om foredragsholderne

Jan Ivar Beddari er åpen kildekode-entusiast bosatt i Volda, med 20 års
erfaring fra norsk og europeisk skyinfrastruktur. Han var teknisk drivkraft i
etableringsfasen av UH-sky / NREC, og har deretter hatt mange roller i ti år
hos den europeiske skyleverandøren Safespring. I 2026 startet han prosjektet
Dataverket, et åpent kontrollplan for datasenter- og skyinfrastruktur. Han
snakket om Dataverket hos [BLUG i september 2026](../2026-09-24-blug/) og om
suveren norsk sky på
[Cloud Native Bergen 2025](../2025-10-28-cloud-native-bergen/).

Linus Johansen utvikler [salmon](https://codeberg.org/Eskpil/salmon), en
identitetsleverandør for mennesker og arbeidslaster med RFC 8693 token
exchange, skrevet i Go.

## Lenker

- [Programmet hos Containerkonferansen](https://containerkonferansen.no/#program)
- [salmon på Codeberg](https://codeberg.org/Eskpil/salmon)
- [Notat om salmon](notat-salmon.md), grunnlaget for Linus sin del
