async function test() {
  const res = await fetch('http://localhost:3000/api/users/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', avatarFit: 'contain' })
  });
  const data = await res.json();
  console.log(res.status, data);
}
test();
