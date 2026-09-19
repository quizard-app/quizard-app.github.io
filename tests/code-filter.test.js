import { describe, it, expect } from 'vitest'
import 'fake-indexeddb/auto'

import { looksLikeCode, isBlankStem } from '../src/app/core/engine/validate.js'

describe('looksLikeCode', () => {
  it('rejects raw markup and TS lines from slides', () => {
    expect(looksLikeCode('<ion-list> @for (i of [1,2,3]; track i) { <ion-item>')).toBe(true)
    expect(looksLikeCode('import { IonContent, IonGrid } from "@ionic/angular/standalone";')).toBe(true)
    expect(looksLikeCode('export class HomePage { store = inject(ProductStore); }')).toBe(true)
    expect(looksLikeCode('const loader = await this.loading.create({ message: "Placing order…" });')).toBe(true)
    expect(looksLikeCode('<div style="width: 360px; margin: 0 auto">')).toBe(true)
    // note: a bare CSS one-liner isn't dense enough to trip the heuristic —
    // acceptable, since markup/TS lines are the ones that produce garbage stems
  })

  it('keeps normal prose sentences', () => {
    expect(looksLikeCode('A beautiful screen can still fail if it lacks usability or accessibility.')).toBe(false)
    expect(looksLikeCode('WCAG 2.2 requires a contrast ratio of at least 4.5 to 1 for body text.')).toBe(false)
    expect(looksLikeCode('Nielsen heuristics include visibility of status and error prevention.')).toBe(false)
  })

  it('rejects empty input', () => {
    expect(looksLikeCode('')).toBe(true)
    expect(looksLikeCode(null)).toBe(true)
  })
})

describe('isBlankStem', () => {
  it('flags fill-in-the-blank stems', () => {
    expect(isBlankStem('Complete the statement: "UX is ___"')).toBe(true)
    expect(isBlankStem('The grid reflow uses ____ breakpoints.')).toBe(true)
    expect(isBlankStem('Which principle does this scenario illustrate?')).toBe(false)
  })
})
