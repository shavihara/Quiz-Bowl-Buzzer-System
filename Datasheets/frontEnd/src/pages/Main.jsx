export default function MainPage() {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Main Presentation</h2>
      <p style={styles.text}>Placeholder for Buzzer Results UI. We will integrate SSE and controls here next.</p>
    </div>
  )
}

const styles = {
  container: { height: '100%', color: '#fff' },
  title: { fontSize: 'clamp(20px, 4vw, 28px)', color: '#ffd700', marginTop: 0 },
  text: { fontSize: 'clamp(14px, 2vw, 16px)' },
}

