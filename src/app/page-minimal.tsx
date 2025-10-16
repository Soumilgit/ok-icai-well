export default function MinimalPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Server is Working!</h1>
      <p>If you can see this page, the Next.js server is running successfully.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Status: ✅ Online</h3>
        <p>External services (Kafka, Redis) are disabled for development.</p>
      </div>
    </div>
  );
}
