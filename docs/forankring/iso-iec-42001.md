# ISO/IEC 42001: ledelsessystem for kunstig intelligens

ISO/IEC 42001 er den første internasjonale standarden for et ledelsessystem for kunstig intelligens (AIMS, *AI
management system*). Den kom i 2023, og er fastsatt som norsk standard under navnet NS-EN ISO/IEC 42001:2026 (april
2026). Standarden gjelder alle virksomheter som bruker eller leverer produkter og tjenester basert på KI, uansett
sektor. ([Standard Norge](https://standard.no/fagomrader/kunstig-intelligens/ledelsessystem-for-kunstig-intelligens--isoiec-42001/))

## Hva den krever

Standarden stiller krav til hvordan en virksomhet etablerer, driver og forbedrer styringen av KI: risiko,
konsekvensvurderinger, åpenhet, automatiserte beslutninger og systemer som endrer seg mens de er i bruk. Den er bygd
på samme struktur som andre ledelsessystemstandarder, som ISO 9001 og ISO/IEC 27001, så den passer inn ved siden av
et ledelsessystem for informasjonssikkerhet som allerede finnes.

- **Kapittel 4–10** er kravene: kontekst, ledelse, planlegging, støtte, drift, evaluering og forbedring.
- **Vedlegg A** lister 38 kontrolltiltak i ni områder. Virksomheten velger og begrunner dem i en
  anvendelseserklæring (*Statement of Applicability*), slik som i ISO/IEC 27001.
- **Vedlegg B** gir veiledning til hvordan kontrolltiltakene i vedlegg A gjennomføres.
- **Vedlegg C** beskriver mulige mål og risikokilder for KI.
- **Vedlegg D** handler om bruk av ledelsessystemet på tvers av bransjer og domener.

Et ledelsessystem etter standarden kan sertifiseres av en tredjepart.

## EU AI Act og EN 18286

For tilbydere av KI-systemer med høy risiko under EU AI Act er ISO/IEC 42001 ikke nok alene. Den europeiske
standarden **EN 18286:2026** (kvalitetsstyringssystem for formålene i AI Act) ble godkjent av CEN-CENELEC 12. juli
2026 og dekker artikkel 17 i forordningen. Den gir presumsjon om samsvar etter artikkel 40 først når den er sitert i
EU-tidende, og det har ikke skjedd ennå. ISO/IEC 42001 er ikke en harmonisert standard og gir ikke slik presumsjon, men et ledelsessystem etter 42001
er et godt utgangspunkt for 18286. ([StandICT](https://www.standict.eu/standards-repository/artificial-intelligence-quality-management-system-eu-ai-act-regulatory))

## Åpne referanser

Standarden selv må kjøpes. Disse åpne repoene gjør den enklere å ta i bruk. De er sjekket 15. oktober 2026, ut fra
innhold, lisens og hvor riktig de gjengir standarden, ikke antall stjerner.

### Hovedreferanser

- **[Ankit-Uniyal/iso-42001-ai-governance-toolkit](https://github.com/Ankit-Uniyal/iso-42001-ai-governance-toolkit)**
  (MIT). Det mest komplette malbiblioteket, skrevet av en lead auditor for ISO 42001. Én mappe per kapittel (4–10)
  med maler for alt standarden krever dokumentert: kontekstregister, oversikt over KI-systemer, omfang, KI-policy,
  RACI, risikovurdering, risikoregister, tiltaksplan, anvendelseserklæring (*Statement of Applicability*),
  kompetansematrise, dokumentstyring, livsløpsprosedyre, konsekvensvurdering, modellkort, leverandørvurdering og
  kontraktsklausuler, revisjonsprogram, ledelsens gjennomgang, avviksregister og hendelseshåndtering. I tillegg en
  sjekkliste for gapanalyse, et veikart over tolv måneder, et fiktivt gjennomarbeidet eksempel, Python-skript for
  å følge opp anvendelseserklæringen og koblinger mot EU AI Act, NIST AI RMF og ISO/IEC 27001. Over 260 commits fra
  april til august 2026, med en egen gjennomgang som rettet opp feil.

  Filene `12-ANNEX-B-AI-CONCEPTS.md` og `13-ANNEX-C-AI-DEVELOPERS.md` har misvisende navn. Innholdet er egne
  veiledninger, ikke vedlegg B og C i standarden, og det sier filene nå selv.

- **[easy-standart/iso-42001-guide](https://github.com/easy-standart/iso-42001-guide)** (CC BY-SA 4.0). Den best
  skrevne veiledningen: hva standarden er og hvordan den er bygd opp, alle 38 kontrolltiltakene i vedlegg A med
  hvilke bevis en revisor ber om, vanlige revisjonsfunn, konsekvensvurdering etter ISO/IEC 42005, kontrolltiltak
  for generativ KI og LLM, og sammenligninger med ISO/IEC 27001, NIST AI RMF, SOC 2 og EU AI Act. Det er den eneste
  av referansene her som sammenligner med EN 18286. Malene er korte og gode, blant annet anvendelseserklæring,
  konsekvensvurdering, KI-policy, systemkort, omfang, hendelseshåndtering og referat fra ledelsens gjennomgang. Alt
  finnes på engelsk og russisk.

  Les den med litt kritisk blikk. Den kommer fra et sertifiseringskonsulentfirma (iso-cert.kz), er lagt ut i én
  commit 13. oktober 2026, innledningen er salgspreget med tall uten kilde, og nummereringen under A.9 avviker fra
  standarden.

### Andre nyttige

- **[kriss-b/llm-iso27001](https://github.com/kriss-b/llm-iso27001)** (MIT). Et ledelsessystem for
  informasjonssikkerhet etter ISO/IEC 27001 som ren markdown i git, laget for å driftes sammen med en LLM-agent, med
  kjørbare sjekker per kontrolltiltak. Mappa `iso42001/` legger ISO 42001 oppå med egen anvendelseserklæring,
  policyer, mal for konsekvensvurdering og sjekker. Smalere dekning, men arbeidsmåten passer oss: styringen ligger i
  git, ved siden av koden.
- **[jeanmalaquias/ai-governance-mapping](https://github.com/jeanmalaquias/ai-governance-mapping)** (MIT). En
  felles katalog som kobler ISO/IEC 42001 mot NIST AI RMF, EU AI Act og OWASP LLM Top 10, med OPA-policyer for det
  som kan sjekkes maskinelt. Liten (16 kontrolltiltak), men viser hvordan styring kan bli kode.
- **[Eticas-AI/ai-risk-taxonomy-public](https://github.com/Eticas-AI/ai-risk-taxonomy-public)** (CC BY 4.0). En
  maskinlesbar taksonomi over KI-risiko i YAML, koblet mot ISO/IEC 42001, EU AI Act og NIST AI RMF. Nyttig som
  felles vokabular i et risikoregister.
- **[robertfels/iso-42001-aims-links-and-resources](https://github.com/robertfels/iso-42001-aims-links-and-resources)**
  (MIT). En kuratert lenkesamling over beslektede standarder, sertifiseringsorganer, EU AI Act og opplæring.
- **[verifywise-ai/verifywise](https://github.com/verifywise-ai/verifywise)**. En plattform for KI-styring som kan
  driftes selv. Ikke åpen kildekode: lisensen (VCEL 1.0) er gratis for offentlig sektor, skoler og
  ikke-kommersiell forskning, mens bedrifter må kjøpe lisens etter 60 dager.
