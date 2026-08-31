// Liveness page for the ANS-01 local-environment slice.
// No product UI ships here — this only proves the web service is up and
// reachable, satisfying the Compose healthcheck's dependent surface.
export default function LivenessPage() {
  return (
    <main>
      <h1>answerya</h1>
      <p>web is up.</p>
    </main>
  );
}
