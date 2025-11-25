export default function AboutPage() {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>About Us</h2>
      <p style={styles.text}>This is a placeholder About Us page. Content will be added later.</p>
    </div>
  )
}

const styles = {
  container: { height: '100%', color: '#fff' },
  title: { fontSize: 'clamp(20px, 4vw, 28px)', color: '#ffd700', marginTop: 0 },
  text: { fontSize: 'clamp(14px, 2vw, 16px)' },
}

