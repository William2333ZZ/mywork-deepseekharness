/**
 * Fakes shared by the bench tests: arXiv's daily RSS, a .bib and a .tex that cite it, and a fake arXiv + Crossref.
 */
export const RSS = (items, day = 'Mon, 05 Oct 2026 00:00:00 -0400') => `<?xml version='1.0' encoding='UTF-8'?>
<rss xmlns:arxiv="http://arxiv.org/schemas/atom" xmlns:dc="http://purl.org/dc/elements/1.1/" version="2.0"><channel>
<title>cs.CL updates on arXiv.org</title><pubDate>${day}</pubDate>
${items.map((x) => `<item><title>${x.title}</title><link>https://arxiv.org/abs/${x.id}</link>
<description>arXiv:${x.id}v1 Announce Type: ${x.type || 'new'}
Abstract: ${x.abstract || 'An abstract.'}</description>
<category>cs.CL</category>${x.cross ? '<category>cs.LG</category>' : ''}
<arxiv:announce_type>${x.type || 'new'}</arxiv:announce_type><dc:creator>${x.authors || 'Ada Lovelace, Alan Turing'}</dc:creator></item>`).join('\n')}
</channel></rss>`

export const BIB = `@inproceedings{vaswani2017attention,
  title={Attention is All you Need},
  author={Vaswani, Ashish and Shazeer, Noam},
  booktitle={NeurIPS}, year={2017},
  eprint={1706.03762}, archivePrefix={arXiv}
}
@inproceedings{devlin2019bert,
  title = {{BERT}: Pre-training of Deep Bidirectional Transformers},
  author = "Devlin, Jacob and Chang, Ming-Wei", year = 2019,
  doi = {10.18653/v1/N19-1423}
}
@article{fake2024, title={Recursive Self-Distillation Makes Transformers Provably Calibrated}, author={Zhang, Wei}, year={2024}}
@article{brown2020gpt3, title={Language Models are Few-Shot Learners}, author={Radford, Alec and Brown, Tom}, year={2017}, journal={arXiv preprint arXiv:2005.14165}}
@misc{hfhub, title={Hugging Face Hub}, url={https://huggingface.co}}
@article{flaky, title={A Paper Behind a Flaky Network}, author={Lee, Kim}, year={2023}}
@article{gone, title={Whatever}, author={X, Y}, year={2020}, doi={10.9999/nope}}
@comment{ignored}
`
export const TEX = 'Transformers replaced recurrence \\citep{vaswani2017attention}. Bidirectional encoders help \\cite{devlin2019bert, fake2024}.\nLarge models learn in context~\\citet[p.~3]{brown2020gpt3}. See \\cite{hfhub,missingkey} and \\cite{flaky,gone}.\n'
/** A fake arXiv + Crossref: what is found, what is not, a 503, a refused request. */
export function fakeScholar(calls = []) {
  const entry = (id, title, authors, year, summary = 'abs') => `<entry><id>http://arxiv.org/abs/${id}v3</id><title>${title}</title><summary>${summary}</summary><published>${year}-06-12T00:00:00Z</published>${authors.map((a) => `<author><name>${a}</name></author>`).join('')}</entry>`
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => body })
  return async (url) => {
    calls.push(url)
    const u = new URL(url)
    if (u.hostname === 'export.arxiv.org') {
      const ids = (u.searchParams.get('id_list') || '').split(',').filter(Boolean)
      if (ids.length) return res(200, '<feed>' + ids.map((id) => (id === '1706.03762' ? entry(id, 'Attention Is All You Need', ['Ashish Vaswani', 'Noam Shazeer'], 2017, 'The Transformer, based solely on attention.') : id === '2005.14165' ? entry(id, 'Language Models are Few-Shot Learners', ['Tom B. Brown', 'Alec Radford'], 2020) : '')).join('') + '</feed>')
      const q = u.searchParams.get('search_query') || ''
      if (/Flaky/i.test(q)) return res(503, 'busy')
      return res(200, '<feed></feed>')
    }
    if (u.hostname === 'api.crossref.org') {
      if (u.pathname.startsWith('/works/')) {
        const doi = decodeURIComponent(u.pathname.slice('/works/'.length))
        if (/n19-1423/i.test(doi)) return res(200, JSON.stringify({ message: { DOI: '10.18653/v1/N19-1423', title: ['BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'], author: [{ given: 'Jacob', family: 'Devlin' }], issued: { 'date-parts': [[2019]] } } }))
        return res(404, 'Resource not found.')
      }
      const q = u.searchParams.get('query.bibliographic') || ''
      if (/Flaky/i.test(q)) return res(403, 'forbidden')
      return res(200, JSON.stringify({ message: { items: [{ DOI: '10.1/other', title: ['Something Else Entirely'], author: [{ family: 'Nobody' }], issued: { 'date-parts': [[2021]] } }] } }))
    }
    return res(404, '')
  }
}

