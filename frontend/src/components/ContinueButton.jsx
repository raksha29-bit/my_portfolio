export default function ContinueButton({ onClick, label = "Continue" }) {
  return (
    <button
      onClick={onClick}
      className="btn"
      style={{
        background: 'linear-gradient(135deg, var(--accent-color) 0%, #db2777 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '30px',
        padding: '10px 28px',
        fontSize: '14px',
        fontWeight: '500',
        letterSpacing: '1px',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(129, 140, 248, 0.25)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(129, 140, 248, 0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(129, 140, 248, 0.25)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px)';
      }}
    >
      {label}
    </button>
  );
}
