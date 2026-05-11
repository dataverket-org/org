# Søknad til NUUG Foundation

_Dataverket - en organisasjon for norsk skyinfrastruktur_

## Prosjektets formål og innhold

### Sammendrag

Dataverket er en ny organisasjon og et initiativ for å styrke norsk kompetanse og utførende kapasitet innen datasenter og skyinfrastruktur:

1. **Kunnskapsbygging** – samle og dele kunnskap om automatisering og drift av datasenter i norsk sammenheng.
2. **Programvareplattform** – utvikle en åpen plattform for styring av datasenter og skyinfrastruktur som hvem som helst kan installere og bruke.

Organisasjonsformen er en ideell stiftelse som vedlikeholder kode og kunnskap åpent, med et samvirke (SA) som finansieringsmodell. Både private og offentlige aktører kan delta på like vilkår.

Plattformen skal være mulig å installere og bruke i tre skalaer: på en enkelt utviklerlaptop, i en spesifikk hjemmelab-konfigurasjon, eller i fullt ut massivt skalerte, nasjonalt distribuerte datasenter-design. I den største modellen skal Dataverket tilgjengeliggjøre design, kunnskap og metodikk for bygging av uniforme datasenter-tjenester i størrelsorden 3 til ~100+ rack.

Den langsiktige visjonen er at Dataverket blir et slags **«FEIDE for infrastrukturtjenester»**: når flere aktører kjører Dataverket-kompatible API-er, kan disse federeres – akkurat som FEIDE lar utdanningsinstitusjoner dele identitetstjenester, kan Dataverket la datasenter og skyleverandører dele infrastrukturtjenester og tilgangsstyring gjennom felles, åpne grensesnitt.

### Bakgrunn

Norsk offentlig sektor og næringsliv er i stor grad avhengig av utenlandske skyleverandører for kritisk infrastruktur. Det finnes i dag ingen godt egnet plattform for å drifte og automatisere datasenter og servere – til tross for at behovet for digital suverenitet og robuste systemer bare øker. De systemene som finnes tilgjengelige er enten for gamle og utdaterte på teknologi og programvaremønstre (Openstack), tilpasset til bare en enkelt tenant (Kubernetes on premise) eller for smale og spesialiserte i omfang (Proxmox) til å fungere som grunnlag for en leveranseplattform i et datasenter.

### Norske åpen kildekode-plattformer i dag – og det manglende laget

Norge har et sterkt økosystem av åpne plattformer drevet av offentlig sektor: NAVs **NAIS**, Skatteetatens **Aurora**, Digitaliseringsdirektoratets **Altinn Studio**, SSBs **Dapla** og Norsk Helsenetts **ROR**, og sikkert mange flere. Disse prosjektene demonstrerer at offentlig sektor kan bygge og dele komplekse plattformer som åpen kildekode. Men de opererer alle i størst grad på **applikasjons- og plattformnivå** – de forutsetter at det allerede finnes et fungerende lag med maskiner, nettverk og lagring under seg, ofte levert av en utenlandsk skyleverandør.

Dette underliggende laget ønsker Dataverket først å fokusere på. Kompetansen til å automatisere fysiske datasenter – provisjonering av maskiner, konfigurering av nettverksfabrikk, styring av lagring og orkestrering av virtuell infrastruktur – er en langt smalere nisje enn applikasjonsutvikling. Færre fagmiljøer behersker teknologien, og det finnes lite åpen programvare som er moderne nok, og tilrettelagt for norske forhold. Dataverket ønsker å fylle dette gapet: et åpent, norsk alternativ for laget *under* plattformene – der maskin, nettverk og lagring møtes. Sammen med de eksisterende PaaS-plattformene kan dette gi Norge en mer komplett og suveren infrastrukturstabel fra fysisk maskinvare til applikasjon.

### Om kunnskapsbygging

Kunnskap om drift og automatisering av datasenter er i dag spredt og ofte innlåst i proprietære miljøer. Vi vil bygge en åpen kunnskapsplattform med åpen kildekode-baserte samarbeidsverktøy:

- **Forgejo** (kode.dataverket.org) – åpen kodeplattform for all kildekode, dokumentasjon, arkitekturbeslutninger (ADR-er) og veiledninger. Fungerer som prosjektets primære samlingspunkt.
- **Zulip** – åpen diskusjonsplattform for faglig dialog, spørsmål og sanntidssamarbeid mellom bidragsytere og interesserte.
- **Felles blogg** – artikler, erfaringsrapporter og tekniske dypdykk for et bredere publikum.

Kunnskapen skal være tilgjengelig for alle – uansett om du jobber i offentlig sektor, næringsliv eller akademia.

### Om arkitektur for plattformen

Plattformen har en hendelsesdrevet arkitektur bygget på velprøvde komponenter:

- **NATS som meldingsryggrad** – robust flermandat-arkitektur med hendelsesdrevet kommunikasjon og finkornet tilgangskontroll mellom alle plattformtjenester
- **Hierarkisk identitets- og tilgangsstyring** – integrasjon med Zitadel for fleksibel B2B-tilgangsmodell med granulær, hierarkisk ressurskontroll
- **Enhetlig, reviderbar drift** – konsistent API på tvers av ulike tjenester med innebygd flerbruker-auditlogging
- **Uforanderlige, API-styrte operativsystem** – Talos Linux og IncusOS som basis-OS på maskinvarenivået. Begge er uforanderlige og uten SSH – all styring skjer via API. Ingen interaktive shell, ingen konfigurasjonsdrift.
- **CloudEvents og globale ressurs-IDer** – alle hendelser følger CloudEvents-standarden, og alle ressurser adresseres med en global, ARN-lignende identifikator som muliggjør konsistent tilgangskontroll og auditlogging på tvers av leverandører, tjenester og datasenter. Denne adresseringsmodellen er grunnlaget for federering: uavhengige Dataverket-installasjoner kan utveksle hendelser og dele ressurser gjennom felles API-er
- **Stordriftskunnskap som åpen kode** – mye av kunnskapen om skalering og drift av store infrastrukturer er i dag innlåst hos de store skyleverandørene. Vi gjør den tilgjengelig som åpen programvare og dokumentasjon.

Plattformen organiseres i navngitte tjenester i norsk tradisjon, inspirert av institusjoner som Vegvesenet og Jernbaneverket:

| Tjeneste | Formål |
|----------|--------|
| **Sentral** | Kontrollplan, orkestrering, fakturering |
| **Nett** | Datasenter-automatisering med eier-og-leietaker-inndeling |
| **Maskin** | Beregning – virtuelle maskiner og fysiske servere |
| **Plattform** | Kubernetes-plattform |
| **Identitet** | Identitets- og tilgangsstyring (Zitadel) |
| **Tjeneste** | Applikasjonsdrift (SaaS-lag) |
| **Objekt** | Objektlagring (S3-kompatibel) |

Plattformen skal kunne installeres og brukes i tre skalaer:

| Skala | Beskrivelse |
|-------|-------------|
| **Laptop** | Alt-i-én utviklingsmiljø på macOS/Linux med virtuelle maskiner. Muliggjør at nye bidragsytere kommer i gang uten dedikert maskinvare. |
| **Hjemmelab** | 4 kompakte servere med nettverkssvitsjer for realistisk flermaskintest av provisjonering, nettverksfabrikk, GPU og lagring. |
| **Datasenter** | Fullt skalert referansedesign med rack, servere, nettverksutstyr og lagring i produksjonsklar konfigurasjon. |

### Organisasjonsmodell

For å nå sine mål ser Dataverket for seg å etablere en todelt organisasjonsmodell:

1. **Ideell stiftelse** – eier og vedlikeholder all kildekode åpent. På sikt kan stiftelsen ansette folk.
2. **Samvirke** – finansierer stiftelsen. Enkeltpersoner, private og offentlige enheter kan organsiere felles kjøp av ressurser og tjenester. Alle medlemmer har demokratisk innflytelse over prioriteringer.

Denne modellen er valgt fordi den likestiller offentlige og private interesser, samtidig som den sikrer at kildekoden forblir åpen og tilgjengelig for alle.

### Hva midlene skal brukes til

Støtten fra NUUG Foundation søkes for å finansiere to hovedaktiviteter:

**A. Etablering av stiftelse og samvirke**

1. **Formell stiftelse** – juridisk etablering av den ideelle stiftelsen Dataverket, inkludert vedtekter, organisasjonsnummer og nødvendig rådgivning.
2. **Samvirke-etablering** – oppretting av samvirkeforetaket som skal finansiere stiftelsen, med vedtekter tilrettelagt for deltakelse fra både offentlige og private enheter.
3. **Kunnskapsplattform** – publisering av arkitekturdokumentasjon, ADR-er og veiledninger som åpne ressurser i norsk kontekst.

**B. Utviklingsmaskinvare – tre hjemmelaber**

Infrastrukturutvikling skiller seg fundamentalt fra vanlig programvareutvikling. Koden som Dataverket utvikler styrer fysisk maskinvare: den provisjonerer servere via BMC/IPMI, konfigurerer nettverkssvitsjer, håndterer lagringsenheter og orkestrerer virtuell infrastruktur. For å utvikle og teste slik kode trenger utvikleren et lokalt miljø som simulerer et datasenter med alle logiske koblingspunkter – flere uavhengige maskiner, et styrbart nettverk og dedikert lagring. Ren programvareemulering på en enkelt maskin er utilstrekkelig fordi den ikke avdekker reelle feilmoder i nettverksfabrikk, maskinvareprovisjonering og distribuert tilstand.

Det søkes om midler til tre like hjemmelaber, én per utvikler. Hver hjemmelab består av 4 kompakte servere og nettverksutstyr som til sammen gir et realistisk, nedskalert datasenter med separate beregnings-, nettverks- og lagringsdomener.

## Plan for gjennomføring og tidsramme

Prosjektet startes opp over 9 måneder, med arbeid definert i tre kategorier:

### Organisasjon og grunnlag (måned 1)

- Formelt etablere stiftelsen og samvirket med vedtekter og organisasjonsnummer
- Publisere arkitekturdokumentasjon og ADR-er som åpen kildekode
- Sette opp utviklingsmiljø med Forgejo (kode.dataverket.org)
- Etablere prosjektets nettside og kunnskapsbase
- Bestille og sette opp tre hjemmelaber for utviklere

### Kjerneutvikling (måned 2–9)

- Implementere laptop-utviklingsmiljø med fullstendig lokal installasjon
- Implementere Identitet-integrasjon med Zitadel for autentisering og autorisasjon
- Implementere Sentral (kontrollplan) med NATS-basert hendelseshåndtering
- Utvikle første versjon av Maskin-tjenesten (provisjonering) testet mot hjemmelabene
- Skrive integrasjonstester og utviklerdokumentasjon

### Formidling og stabilisering (måned 1–9)

- Validere plattformen på både laptop- og hjemmelab-installasjon
- Presentere prosjektet på minst én relevant konferanse (f.eks. NUUG-møte, NDC, Booster, eller FOSDEM)
- Publisere sluttrapport med teknisk dokumentasjon og erfaringer
- Rekruttere de første eksterne bidragsyterne til prosjektet

## Budsjett

| Post | Beløp (NOK) |
|------|-------------|
| **Organisasjon** | |
| Stiftelse-etablering (juridisk rådgivning, vedtekter, registrering) | 40 000 |
| Samvirke-etablering (vedtekter, rådgivning, registrering) | 30 000 |
| **Utviklingsmaskinvare** | |
| 3 × hjemmelab (4 servere, nettverksutstyr og kabler per lab) | 210 000 |
| **Drift og formidling** | |
| Infrastruktur og drift (CI/CD, domener, hosting) | 30 000 |
| Konferansedeltakelse og formidling (reise, registrering) | 30 000 |
| Dokumentasjon og kunnskapsplattform | 20 000 |
| Uforutsette kostnader | 20 000 |
| **Totalt** | **380 000** |

I tillegg til midlene det søkes om bidrar søker med egeninnsats i ni måneder fra 1. mai 2026, selvfinansiert. Denne innsatsen dekker all programvareutvikling, arkitekturarbeid og prosjektledelse.

Utstyr som anskaffes med støtte fra stiftelsen vil fortsette å brukes til prosjektets formål etter prosjektperioden. Maskinvaren forblir i stiftelsens eie og brukes til utvikling, testing og demonstrasjon. Dersom prosjektet ikke lykkes eller utstyret ikke lenger kan brukes til prosjektets formål, skal maskinvaren doneres til andre organisasjoner som fremmer åpen kildekode.

## Offentlig tilgjengeliggjøring av resultater

Dataverket bruker to åpne lisenser som er valgt for å sikre maksimal åpenhet og hindre fremtidig innlåsing:

- **Programvare**: All kildekode under **AGPL-3.0**. Den sikrer at alle som bruker eller endrer plattformen – også som nettverkstjeneste – må dele endringene tilbake. Koden kan ikke lukkes inn i proprietære produkter.
- **Dokumentasjon**: Alt under **CC BY-SA 4.0**, samme lisens Codeberg bruker for sin dokumentasjon.

Alt publiseres på Dataverkets Forgejo-instans (kode.dataverket.org) og speiles til GitHub.

Konkret vil følgende gjøres offentlig tilgjengelig:

- **Kildekode** (AGPL-3.0): Alle plattformkomponenter, CLI-verktøy og infrastrukturkonfigurasjon
- **Kunnskapsbase** (CC BY-SA 4.0): Dokumentasjon om datasenterautomasjon, arkitekturbeslutninger (ADR-er) og veiledninger tilrettelagt for norske forhold
- **Brukerdokumentasjon** (CC BY-SA 4.0): Guider, tutorials og referansedokumentasjon publisert på prosjektets nettside
- **Maskinvarelister**: Komplette materiallister for alle tre installasjonsscenariene (laptop, hjemmelab, datasenter)
- **Foredrag og presentasjoner**: Minst én offentlig presentasjon av prosjektet og dets resultater
- **Sluttrapport**: Publiseres på NUUG Foundations nettsider i henhold til stiftelsens krav

Prosjektet er designet for åpenhet fra dag én. Utviklingen skjer i det åpne, og all kommunikasjon og beslutninger dokumenteres offentlig gjennom ADR-prosessen.

## Om søker og prosjektdeltakere

**Jan Ivar Beddari** har 20 års erfaring med IT-infrastruktur og åpen kildekode. Han var teknisk leder for det akademiske IaaS-prosjektet UH-sky, deretter ingeniør og CTO i Safespring og nylig leder for forskning og utvikling i samme firma. Hos Safespring designet og bygde han hendelsesdrevne kontrollplan for skyinfrastruktur, og det er denne erfaringen som er den direkte forløperen til Dataverket. Beddari har tidligere vært sjefsingeniør ved Universitetet i Bergen og har holdt foredrag på blant annet Config Management Camp (Gent, 2016) og Cloud Native Bergen (2025).

Beddari presenterte deler av visjonen bak Dataverket på **Cloud Native Bergen 2025** med foredraget *«Building a Sovereign Cloud: What are we missing to solve Norway's digital future?»* ([2025.cloudnativebergen.dev/speaker/jan-ivar-beddari](https://2025.cloudnativebergen.dev/speaker/jan-ivar-beddari)).

**Lars Solem** er knyttet til prosjektet som utvikler. Solem har 18 års erfaring som utvikler og teknisk leder, med bred kompetanse innen DevOps, containerteknologi, Kubernetes og infrastruktur-som-kode. Han har blant annet seks år som sjefskonsulent, partner og gruppeleder hos Redpill Linpro med spesialisering i OpenShift og åpne plattformer, og har bakgrunn fra prosjekter hos blant andre Skatteetaten, Helsedirektoratet, Avinor og Universitetet i Oslo.

Flere utviklere planlegges rekruttert tidlig i prosjektperioden fra det norske åpen kildekode-miljøet.

## Samtykke

Søker samtykker til at NUUG Foundation kan opplyse om tildeling og publisere rapporter om bruk av tildelte midler på sine nettsider.
