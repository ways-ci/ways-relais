// Copie le cœur commun dans un paquet avant sa compilation.
//
// Chaque paquet publié (nœud n8n, pièce Activepieces) doit être autonome : n8n
// refuse toute dépendance d'exécution dans un nœud vérifié. Le cœur y entre
// donc en copie, régénérée à chaque build, jamais modifiée à la main : la
// règle ne vit qu'une fois, dans coeur/.
//
// Usage : node ../../outils/copier-coeur.mjs <dossier de destination>
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(racine, 'coeur')
const dest = process.argv[2]
if (!dest) {
  console.error('Usage : node outils/copier-coeur.mjs <dossier de destination>')
  process.exit(1)
}
const cible = resolve(process.cwd(), dest)
if (!cible.startsWith(racine) || cible === source) {
  console.error(`Destination refusée : ${cible}`)
  process.exit(1)
}

rmSync(cible, { recursive: true, force: true })
mkdirSync(cible, { recursive: true })

const ENTETE = '// Copie générée depuis coeur/ par outils/copier-coeur.mjs : ne pas modifier ici.\n'
let n = 0
for (const nom of readdirSync(source)) {
  if (!nom.endsWith('.ts')) continue
  const texte = readFileSync(join(source, nom), 'utf8')
    // Les imports relatifs perdent leur extension : le compilateur du paquet
    // produit du CommonJS, où « ./pays.ts » ne se résout pas.
    .replace(/(from\s+'\.\/[\w-]+)\.ts'/g, "$1'")
  writeFileSync(join(cible, nom), ENTETE + texte)
  n++
}
if (n === 0) {
  console.error('Aucun fichier copié : le cœur est introuvable.')
  process.exit(1)
}
console.log(`coeur : ${n} fichiers copiés dans ${dest}`)
