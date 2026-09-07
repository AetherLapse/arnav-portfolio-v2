import { useState } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import PageLink from '../components/PageLink';
import './WorksPage.css';

const CATEGORIES = [
  { id: 'ALL', label: 'All work' },
  { id: 'KINETIC_CUTS', label: 'Video editing' },
  { id: 'GRID_ARCHIVES', label: 'Social grids' },
  { id: 'CONTENT_DEPLOYMENTS', label: 'Social content' },
  { id: 'BRAND_IDENTITIES', label: 'Brand identity' },
];

function ProjectCard({ project, onOpen, priority }) {
  const [imageFailed, setImageFailed] = useState(false);
  const category = CATEGORIES.find(item => item.id === project.sector)?.label;

  return (
    <button className="work-project" onClick={() => onOpen(project)} aria-label={`View ${project.title}`}>
      <div className="work-project-image">
        {imageFailed ? (
          <span className="work-image-fallback">Preview unavailable</span>
        ) : (
          <img src={project.img} alt="" loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setImageFailed(true)} />
        )}
      </div>
      <div className="work-project-caption">
        <div>
          <p className="work-category">{category}</p>
          <h2 className="font-dragon">{project.title}</h2>
        </div>
        <ArrowUpRight size={24} strokeWidth={1.5} aria-hidden="true" />
      </div>
    </button>
  );
}

export default function WorksPage({ projects, onOpenProject, navigate, onContact }) {
  const [category, setCategory] = useState('ALL');
  const filtered = category === 'ALL' ? projects : projects.filter(project => project.sector === category);

  return (
    <main className="works-page" aria-labelledby="works-heading">
      <div className="works-container">
        <header className="works-header">
          <PageLink href="/" navigate={navigate} className="works-back"><ArrowLeft size={16} aria-hidden="true" /> Back to portfolio</PageLink>
          <h1 id="works-heading" tabIndex={-1} className="font-dragon">WORKS<span aria-hidden="true">.</span></h1>
          <p>Video, motion, and design. A closer look at the work.</p>
        </header>

        <div className="works-collection">
          <div className="works-filters" role="group" aria-label="Filter projects">
            {CATEGORIES.map(item => (
              <button key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)} className="works-filter">
                {item.label}
              </button>
            ))}
          </div>
          <div className="works-collection-note">
            <span>Preview collection</span>
            <span role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'project' : 'projects'}</span>
          </div>
          {filtered.length ? (
            <div className="works-grid">
              {filtered.map((project, index) => <ProjectCard key={project.id} project={project} onOpen={onOpenProject} priority={index < 2} />)}
            </div>
          ) : (
            <div className="works-empty">
              <h2 className="font-dragon">More work to come.</h2>
              <p>Projects in this category will appear here.</p>
              <button className="works-text-button" onClick={() => setCategory('ALL')}>View all work <ArrowUpRight size={16} aria-hidden="true" /></button>
            </div>
          )}
        </div>

        <footer className="works-footer">
          <div>
            <p className="font-dragon">LET’S MAKE SOMETHING.</p>
            <button className="works-contact" onClick={onContact}>Start a project <ArrowUpRight size={18} aria-hidden="true" /></button>
          </div>
          <PageLink href="/" navigate={navigate} className="works-back"><ArrowLeft size={16} aria-hidden="true" /> Back to portfolio</PageLink>
        </footer>
      </div>
    </main>
  );
}
