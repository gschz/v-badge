# v-badge <sup>[![Version Badge][1]][url]</sup>

Genera un badge SVG con la versión tomada desde `package.json` del repositorio.

> Nota: `v-badge-khaki.vercel.app` es una instancia de uso personal.

Formato base:

`https://<domain>/api/<user>/<repo>.svg` o `https://<domain>/<user>/<repo>.svg`

Parámetro opcional:

- `theme=auto` (default): adapta color con `prefers-color-scheme`
- `theme=light`: fuerza colores para tema claro
- `theme=dark`: fuerza colores para tema oscuro

Ejemplos:

- `https://v-badge-khaki.vercel.app/gschz/v-badge.svg` ![Version Badge][1]
- `https://v-badge-khaki.vercel.app/gschz/v-badge.svg?theme=auto` ![Version Badge][2]
- `https://v-badge-khaki.vercel.app/gschz/v-badge.svg?theme=dark` ![Version Badge][3]
- `https://v-badge-khaki.vercel.app/gschz/v-badge.svg?theme=light` ![Version Badge][4]

## Own deploy

1. Haz fork/clone del repo y despliega en Vercel.
2. Configura variables de entorno usando `.env.example`:
   - `GITHUB_PAT`: token para evitar límites/rate limit de GitHub API.
   - `WHITELIST`: usuarios permitidos, separados por coma (opcional).
3. Reemplaza `https://<domain>` por tu dominio de Vercel en el badge del README.

[1]: https://v-badge-khaki.vercel.app/gschz/v-badge.svg
[2]: https://v-badge-khaki.vercel.app/gschz/v-badge.svg?theme=auto
[3]: https://v-badge-khaki.vercel.app/gschz/v-badge.svg?theme=dark
[4]: https://v-badge-khaki.vercel.app/gschz/v-badge.svg?theme=light
[url]: https://github.com/gschz/v-badge

---

> Basado en: https://github.com/ljharb/begin-versionbadg.es/tree/main
