import React from 'react'
class FBOErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: 340, height: 340,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30,80,200,0.4), rgba(10,30,80,0.2))',
            animation: 'micFloat 1.5s ease-in-out infinite',
            border: '1px solid rgba(80,140,255,0.3)',
          }} />
        </div>
      )
    }
    return this.props.children
  }
}
export default FBOErrorBoundary