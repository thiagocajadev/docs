import { refractor } from 'refractor/all'

// Prism's SQL grammar treats `#` as a MySQL-style line comment, which swallows
// T-SQL temp tables (#local, ##global). Only treat `#` as a comment opener when
// it isn't immediately followed by an identifier, and tokenize temp tables
// (styled like class names). The temp-table rule must sit after string and
// identifier (so literals/comments mentioning `#foo` stay intact) but before
// keyword (so `#temp` isn't half-matched as the TEMP keyword).
const sql = Object.entries(refractor.languages.sql)
refractor.languages.sql = Object.fromEntries(
  sql.flatMap(([name, rule]) => {
    if (name === 'comment') {
      return [
        [
          name,
          {
            pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#(?![\w#$])).*)/,
            lookbehind: true,
          },
        ],
      ]
    }
    if (name === 'identifier') {
      return [
        [name, rule],
        ['temp-table', { pattern: /##?[\w$]+/, alias: 'class-name' }],
      ]
    }
    return [[name, rule]]
  }),
)

export { refractor }
