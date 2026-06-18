---
title: "Koden"
description: "Plattformen utvikles åpent som fri programvare på kode.dataverket.org. Alt vi bygger forvaltes som et felles gode."
type: page
project: dataverket
weight: 60
icon: code
---

{{< intro >}}
Plattform-kode, dokumentasjon, schema og vedtektsdiskusjoner ligger
åpent. Du kan lese, hente ned, prøve, foreslå endringer eller fyre av
en idé i en samtale, alt på samme infrastruktur som koden selv.
{{< /intro >}}

## Hvor koden lever

All offentlig kode ligger på [kode.dataverket.org](https://kode.dataverket.org), en [Forgejo](https://forgejo.org/)-instans drevet i samvirkets eget felleskap. Forgejo er fri programvare laget av Codeberg-samfunnet, en bevisst gjenkjennelig forfatter for en plattform om suverenitet.

{{< cards count=3 >}}

{{< card >}}
### Plattform-kode

Koden som datasenter-leverandørene kjører for å tilby suveren bare metal og KI-cluster.

[Se repoene →](https://kode.dataverket.org)
{{< /card >}}

{{< card >}}
### Dokumentasjon

Selve nettsiden, dokumentasjonsskjemaet, og verktøykjeden for arkitekturbeslutninger. Alt åpent.

[Les dokumentasjonen →](https://docs.dataverket.org)
{{< /card >}}

{{< card >}}
### Vedtekter og samtaler

Vedtekter, ADR-er om organisasjonen, og diskusjon om retningen, versjonert som koden.

[Se beslutningene →](https://docs.dataverket.org/decisions/)
{{< /card >}}

{{< /cards >}}

## Lisens

All kode utgis under en åpen lisens som tillater fri bruk, modifikasjon og videredistribusjon. Innholdet på denne nettsiden står under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). Konkrete lisensvalg per kode-repo er dokumentert i hvert repo.

Den planlagte ideelle stiftelsen vil eie og forvalte koden uavhengig av enkeltmedlemmers interesser, slik at koden forblir åpen selv om samvirket eller enkeltmedlemmer endrer mening.

## Hvordan bidra

Du trenger ikke være medlem for å bidra med kode eller dokumentasjon. Bidrag er velkomne på alle nivåer:

{{< columns count=2 >}}

{{< column >}}
### Lett vei inn

- Forbedre dokumentasjon, oversette tekster, finne skrivefeil
- Rapportere feil eller foreslå forbedringer som issues
- Diskutere arkitekturvalg åpent på diskusjon.dataverket.org

Disse bidragene krever ingen norsk-spesifikk kompetanse.
{{< /column >}}

{{< column >}}
### Dypere bidrag

- Implementere features i plattform-koden
- Skrive ADR-er som dokumenterer arkitekturvalg
- Teste plattformen i egen drift
- Bidra med erfaring fra anskaffelser, drift eller compliance

Dypere bidrag kan bli grunnlag for medlemskap som ansatt eller frivillig.
{{< /column >}}

{{< /columns >}}

## Forholdet til docs.dataverket.org

Den tekniske dokumentasjonen, inkludert arkitekturbeslutninger og forfatterregler, ligger på [docs.dataverket.org](https://docs.dataverket.org). Den bygges fra samme repo som koden, med strikt skjema og åpen historikk.

{{< button link="https://kode.dataverket.org" text="Se koden" variant="primary" >}}
{{< button link="https://docs.dataverket.org" text="Les dokumentasjonen" variant="secondary" >}}
