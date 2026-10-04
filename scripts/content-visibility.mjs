/** Remove unpublished records before JSON reaches the browser or production bundle. */
export function publicContentPlugin() {
  return {
    name: 'inspatium-public-content',
    enforce: 'pre',
    transform(source, id) {
      const filename = id.split('?')[0].replaceAll('\\', '/');
      if (!filename.endsWith('/src/content.json')) return;
      const content = JSON.parse(source);
      const hiddenProjects = new Set((content.projects || []).filter(project => project.visibility === 'hidden').map(project => project.id));
      const removeHiddenProjectLink = item => hiddenProjects.has(item.project) ? { ...item, project: null } : item;
      content.projects = (content.projects || []).filter(project => project.visibility !== 'hidden');
      content.history = (content.history || []).map(removeHiddenProjectLink);
      content.news = (content.news || []).filter(item => item.visibility === 'public').map(removeHiddenProjectLink);
      content.publications = (content.publications || []).map(removeHiddenProjectLink).map(paper => paper.public_release ? paper : { ...paper, doi: '', url: '', code_url: '' });
      return { code: JSON.stringify(content), map: null };
    },
  };
}
