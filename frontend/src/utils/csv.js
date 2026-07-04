// V2.3: Reports sayfası CSV dışa aktarım yardımcıları.
// MVP kararı: CSV frontend'de, zaten fetch edilmiş rapor verisinden üretilir —
// backend'de ayrı bir export endpoint'i açmaya gerek yoktur (spec'te de
// "backend export endpoint açmak şart değil" olarak belirtilmiştir).

// Bir hücre değerini CSV için güvenli hale getirir: virgül/tırnak/satır
// sonu içeriyorsa çift tırnak içine alır ve iç tırnakları ikiye katlar.
function escapeCsvCell(value) {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// headers: string[], rows: array of arrays (aynı sırada headers ile)
function buildCsvContent(headers, rows) {
  const lines = [headers.map(escapeCsvCell).join(';')]
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(';'))
  }
  return lines.join('\r\n')
}

// Excel'in Türkçe karakterleri (ç, ş, ğ, ı, ö, ü) doğru göstermesi için
// UTF-8 BOM (﻿) eklenir — bu olmadan Excel dosyayı ANSI sanıp
// Türkçe karakterleri bozuk gösterebilir.
export function downloadCsv(filename, headers, rows) {
  const content = buildCsvContent(headers, rows)
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// "2026-07-15" -> "2026-07" (dosya adı için dönem etiketi)
export function periodTagFromDate(dateStr) {
  return (dateStr || '').slice(0, 7)
}
