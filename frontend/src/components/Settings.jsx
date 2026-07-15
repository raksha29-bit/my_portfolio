import { Shield, HardDrive, Cpu, Database, CpuIcon } from 'lucide-react';

export default function Settings() {
  const settingsInfo = [
    {
      title: 'Application Module',
      icon: Shield,
      color: 'var(--accent-color)',
      bg: 'var(--accent-light)',
      fields: [
        { label: 'Core version', value: 'v1.4.0 (Release)' },
        { label: 'Environment mode', value: 'Development' },
        { label: 'CORS policy', value: 'Restricted (localhost only)' },
      ],
    },
    {
      title: 'Storage Infrastructure',
      icon: HardDrive,
      color: 'var(--success-color)',
      bg: 'rgba(16, 185, 129, 0.1)',
      fields: [
        { label: 'Active provider', value: 'LocalStorageProvider (Local File Abstraction)' },
        { label: 'Host target path', value: 'backend/app/static/uploads' },
        { label: 'Local server path', value: '/static/uploads/' },
      ],
    },
    {
      title: 'AI Companion Layer',
      icon: Cpu,
      color: 'var(--warning-color)',
      bg: 'rgba(245, 158, 11, 0.1)',
      fields: [
        { label: 'Mascot Guide LLM', value: 'MockProvider (SakuraPersona v2)' },
        { label: 'Streaming capabilities', value: 'Mock streams active' },
        { label: 'Ollama endpoint', value: 'http://localhost:11434 (configured)' },
      ],
    },
    {
      title: 'Database Engine',
      icon: Database,
      color: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.1)',
      fields: [
        { label: 'SQLAlchemy dialect', value: 'SQLite (sqlite:///./portfolio.db)' },
        { label: 'Pool health checks', value: 'Healthy (pre-ping active)' },
        { label: 'Migrations state', value: 'Alembic revision e4023d29d3ee (applied)' },
      ],
    },
  ];

  return (
    <div className="content-container">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '4px' }}>System Settings</h1>
        <p>View administrative modules and environment runtime metadata.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {settingsInfo.map((block) => {
          const Icon = block.icon;
          return (
            <div
              key={block.title}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div
                  style={{
                    backgroundColor: block.bg,
                    color: block.color,
                    padding: '8px',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                  }}
                >
                  <Icon size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{block.title}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {block.fields.map((field) => (
                  <div
                    key={field.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '14px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{field.label}</span>
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)', textAlign: 'right' }}>
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
