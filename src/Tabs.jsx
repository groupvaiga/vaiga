export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div>
      {[
        { id: 'speak', label: '🎙 Speak' },
        { id: 'screen', label: '📺 Screen' },
      ].map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}