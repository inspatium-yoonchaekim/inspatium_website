/** Remove unpublished records before JSON reaches the browser or production bundle. */
export function publicContentPlugin() {
  return {
    name: 'inspatium-public-content',
    enforce: 'pre',
    transform(source, id) {
      const filename = id.split('?')[0].replaceAll('\\', '/');
      if (!filename.endsWith('/src/content.json')) return;
      const content = JSON.parse(source);
      content.news = (content.news || []).filter(item => item.visibility === 'public');
      content.publications = (content.publications || []).map(paper => paper.public_release ? paper : { ...paper, doi: '', url: '', code_url: '' });
      return { code: JSON.stringify(content), map: null };
    },
  };
}
