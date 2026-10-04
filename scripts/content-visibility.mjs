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
      const hiddenPublications = new Set((content.publications || []).filter(paper => paper.visibility === 'hidden').map(paper => paper.id));
      const removeHiddenProjectLink = item => hiddenProjects.has(item.project) ? { ...item, project: null } : item;
      content.projects = (content.projects || []).filter(project => project.visibility !== 'hidden').map(project => hiddenPublications.has(project.publication) ? { ...project, publication: null } : project);
      content.history = (content.history || []).map(removeHiddenProjectLink);
      content.news = (content.news || []).filter(item => item.visibility === 'public').map(removeHiddenProjectLink);
      content.publications = (content.publications || []).filter(paper => paper.visibility !== 'hidden').map(removeHiddenProjectLink).map(paper => paper.public_release ? paper : { ...paper, doi: '', url: '', code_url: '' });
      return { code: JSON.stringify(content), map: null };
    },
  };
}
