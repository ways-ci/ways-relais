// Prépare dist/ de la pièce Activepieces comme un paquet installable.
//
// Le serveur d'Activepieces lit les traductions dans <racine du paquet>/src/i18n/<langue>.json
// (pieces-framework, i18n.ts). Le paquet publié est donc dist/ lui-même : son
// package.json pointe sur ./src/index.js, et les traductions y sont copiées.
//
// À lancer depuis paquets/piece-ways-relais, après tsc.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs'

const dist = 'dist'
if (!existsSync(`${dist}/src/index.js`)) {
  console.error('dist/src/index.js absent : lancer tsc avant.')
  process.exit(1)
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
delete pkg.scripts
delete pkg.devDependencies
writeFileSync(`${dist}/package.json`, JSON.stringify(pkg, null, 2) + '\n')

mkdirSync(`${dist}/src/i18n`, { recursive: true })
cpSync('src/i18n', `${dist}/src/i18n`, { recursive: true })
for (const f of ['README.md', 'logo.svg']) if (existsSync(f)) cpSync(f, `${dist}/${f}`)
cpSync('../../LICENSE', `${dist}/LICENSE`)

// Chaque clé de traduction doit exister telle quelle dans le code compilé :
// une clé qui ne correspond plus à aucun texte ne traduit plus rien, en silence.
const code = [
  readFileSync(`${dist}/src/index.js`, 'utf8'),
  ...['format-phone-number', 'format-cfa-amount', 'check-public-holiday'].map((a) =>
    readFileSync(`${dist}/src/lib/actions/${a}.js`, 'utf8'),
  ),
].join('\n')
const fr = JSON.parse(readFileSync('src/i18n/fr.json', 'utf8'))
const orphelines = Object.keys(fr).filter((k) => !code.includes(JSON.stringify(k).slice(1, -1)) && !code.includes(k))
if (orphelines.length) {
  console.error(`Traductions sans texte d'origine dans le code :\n- ${orphelines.join('\n- ')}`)
  process.exit(1)
}
console.log(`dist prêt : package.json, ${Object.keys(fr).length} traductions vérifiées`)
