/* ═══════════════════════════════════════
   TYBT — Premium Frontend Logic
═══════════════════════════════════════ */

let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');

// ─── API Helper ───
async function api(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (res.status === 401) { logout(); return null; }
  return res.json();
}

// ─── Auth ───
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  const data = await api('/api/auth/login', 'POST', { username, password });
  if (data?.token) {
    token = data.token; user = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    showApp();
  } else {
    errEl.textContent = data?.error || 'Xatolik yuz berdi';
    errEl.classList.remove('hidden');
  }
}

function logout() {
  token = null; user = null;
  localStorage.removeItem('token'); localStorage.removeItem('user');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
}

function showApp() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('user-name').textContent = user.full_name;
  document.getElementById('user-role').textContent = user.role === 'admin' ? 'Administrator' : 'Klinitsist';
  document.getElementById('user-avatar').textContent = user.full_name[0];
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = user.role === 'admin' ? '' : 'none');
  showPage('dashboard');
}

// ─── Navigation ───
const pageTitles = { dashboard: 'Boshqaruv paneli', doctors: 'Shifokorlar', patients: 'Bemorlar', diseases: 'Tashxislar', activity: 'Faoliyat jurnali', profile: 'Bemor profili' };

document.querySelectorAll('.sidebar-nav a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    showPage(a.dataset.page);
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobile-overlay').classList.remove('active');
  });
});

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`page-${page}`).classList.remove('hidden');
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const navLink = document.querySelector(`[data-page="${page}"]`);
  if (navLink) navLink.classList.add('active');
  document.getElementById('page-title').textContent = pageTitles[page] || '';
  if (page === 'dashboard') loadDashboard();
  if (page === 'doctors') loadDoctors();
  if (page === 'patients') loadPatients();
  if (page === 'diseases') loadDiseases();
  if (page === 'activity') loadActivity();
}

// ─── Dashboard ───
async function loadDashboard() {
  const [doctors, patients, diseases] = await Promise.all([api('/api/doctors'), api('/api/patients'), api('/api/diseases')]);
  document.getElementById('stat-doctors').textContent = doctors?.length || 0;
  document.getElementById('stat-patients').textContent = patients?.length || 0;
  document.getElementById('stat-diseases').textContent = diseases?.length || 0;
  try { const act = await api('/api/activity'); document.getElementById('stat-activity').textContent = act?.length || 0; } catch(e) {}
  loadCharts(doctors, patients, diseases);
}

let severityChart, doctorsChart, ageChart;
function loadCharts(doctors, patients, diseases) {
  if (!diseases || !patients) return;
  // Severity
  const sev = { yengil: 0, "o'rtacha": 0, "og'ir": 0, "juda og'ir": 0 };
  diseases.forEach(d => { if (sev[d.severity] !== undefined) sev[d.severity]++; });
  const ctx1 = document.getElementById('severity-chart').getContext('2d');
  if (severityChart) severityChart.destroy();
  severityChart = new Chart(ctx1, { type: 'doughnut', data: { labels: ['Yengil', "O'rtacha", "Og'ir", "Juda og'ir"], datasets: [{ data: Object.values(sev), backgroundColor: ['#16A34A','#F59E0B','#EA580C','#DC2626'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } } } });
  // Doctors
  const docMap = {};
  patients.forEach(p => { docMap[p.doctor_name || '-'] = (docMap[p.doctor_name || '-'] || 0) + 1; });
  const ctx2 = document.getElementById('doctors-chart').getContext('2d');
  if (doctorsChart) doctorsChart.destroy();
  doctorsChart = new Chart(ctx2, { type: 'bar', data: { labels: Object.keys(docMap), datasets: [{ data: Object.values(docMap), backgroundColor: '#2563EB', borderRadius: 6, barThickness: 32 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } } });
  // Age
  const age = { '0-17': 0, '18-30': 0, '31-50': 0, '51-70': 0, '70+': 0 };
  patients.forEach(p => { const a = Math.floor((Date.now() - new Date(p.birth_date)) / 31557600000); if (a <= 17) age['0-17']++; else if (a <= 30) age['18-30']++; else if (a <= 50) age['31-50']++; else if (a <= 70) age['51-70']++; else age['70+']++; });
  const ctx3 = document.getElementById('age-chart').getContext('2d');
  if (ageChart) ageChart.destroy();
  ageChart = new Chart(ctx3, { type: 'pie', data: { labels: Object.keys(age), datasets: [{ data: Object.values(age), backgroundColor: ['#dbeafe','#93c5fd','#3b82f6','#1d4ed8','#1e3a5f'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } } } });
}

// ─── Doctors CRUD ───
async function loadDoctors() {
  const search = document.getElementById('doctor-search').value;
  const data = await api(`/api/doctors?search=${encodeURIComponent(search)}`);
  document.getElementById('doctors-table').innerHTML = data?.map(d => `<tr>
    <td><strong>${d.full_name}</strong></td><td>${d.specialization}</td><td><span class="badge badge-info">${d.department}</span></td><td>${d.phone || '—'}</td>
    <td class="table-actions">
      <button class="btn btn-ghost btn-sm admin-only" onclick="editDoctor(${d.id})" ${user.role!=='admin'?'style="display:none"':''}>✏️</button>
      <button class="btn btn-ghost btn-sm admin-only" onclick="deleteDoctor(${d.id})" ${user.role!=='admin'?'style="display:none"':''}>🗑️</button>
    </td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px">Ma\'lumot topilmadi</td></tr>';
}
function openDoctorModal(doc = null) {
  document.getElementById('doctor-modal-title').textContent = doc ? 'Shifokorni tahrirlash' : 'Yangi Shifokor';
  document.getElementById('doctor-id').value = doc?.id || '';
  document.getElementById('doctor-name').value = doc?.full_name || '';
  document.getElementById('doctor-spec').value = doc?.specialization || '';
  document.getElementById('doctor-dept').value = doc?.department || '';
  document.getElementById('doctor-phone').value = doc?.phone || '';
  document.getElementById('doctor-email').value = doc?.email || '';
  document.getElementById('doctor-modal').classList.add('active');
}
async function editDoctor(id) { const d = await api(`/api/doctors/${id}`); if (d) openDoctorModal(d); }
async function saveDoctor() {
  const id = document.getElementById('doctor-id').value;
  const body = { full_name: document.getElementById('doctor-name').value, specialization: document.getElementById('doctor-spec').value, department: document.getElementById('doctor-dept').value, phone: document.getElementById('doctor-phone').value, email: document.getElementById('doctor-email').value };
  await api(`/api/doctors${id ? '/'+id : ''}`, id ? 'PUT' : 'POST', body);
  closeModal('doctor-modal'); loadDoctors();
  showToast(id ? 'Shifokor yangilandi' : 'Yangi shifokor qo\'shildi');
}
async function deleteDoctor(id) { if (!confirm('O\'chirmoqchimisiz?')) return; await api(`/api/doctors/${id}`, 'DELETE'); loadDoctors(); showToast('Shifokor o\'chirildi', 'error'); }

// ─── Patients CRUD ───
async function loadPatients() {
  const search = document.getElementById('patient-search').value;
  const data = await api(`/api/patients?search=${encodeURIComponent(search)}`);
  document.getElementById('patients-table').innerHTML = data?.map(p => `<tr>
    <td><a href="#" onclick="viewPatient(${p.id})" style="color:var(--primary);font-weight:600">${p.full_name}</a></td>
    <td>${p.birth_date?.split('T')[0] || ''}</td><td>${p.gender}</td><td>${p.doctor_name || '—'}</td>
    <td class="table-actions">
      <button class="btn btn-ghost btn-sm" onclick="editPatient(${p.id})">✏️</button>
      <button class="btn btn-ghost btn-sm admin-only" onclick="deletePatient(${p.id})" ${user.role!=='admin'?'style="display:none"':''}>🗑️</button>
    </td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px">Ma\'lumot topilmadi</td></tr>';
}
async function openPatientModal(pat = null) {
  document.getElementById('patient-modal-title').textContent = pat ? 'Bemorni tahrirlash' : 'Yangi Bemor';
  document.getElementById('patient-id').value = pat?.id || '';
  document.getElementById('patient-name').value = pat?.full_name || '';
  document.getElementById('patient-birth').value = pat?.birth_date?.split('T')[0] || '';
  document.getElementById('patient-gender').value = pat?.gender || 'erkak';
  document.getElementById('patient-phone').value = pat?.phone || '';
  document.getElementById('patient-address').value = pat?.address || '';
  const doctors = await api('/api/doctors');
  document.getElementById('patient-doctor').innerHTML = doctors?.map(d => `<option value="${d.id}" ${pat?.doctor_id==d.id?'selected':''}>${d.full_name}</option>`).join('') || '';
  document.getElementById('patient-modal').classList.add('active');
}
async function editPatient(id) { const p = await api(`/api/patients/${id}`); if (p) openPatientModal(p); }
async function savePatient() {
  const id = document.getElementById('patient-id').value;
  const body = { full_name: document.getElementById('patient-name').value, birth_date: document.getElementById('patient-birth').value, gender: document.getElementById('patient-gender').value, phone: document.getElementById('patient-phone').value, address: document.getElementById('patient-address').value, doctor_id: document.getElementById('patient-doctor').value };
  await api(`/api/patients${id ? '/'+id : ''}`, id ? 'PUT' : 'POST', body);
  closeModal('patient-modal'); loadPatients();
  showToast(id ? 'Bemor yangilandi' : 'Yangi bemor qo\'shildi');
}
async function deletePatient(id) { if (!confirm('O\'chirmoqchimisiz?')) return; await api(`/api/patients/${id}`, 'DELETE'); loadPatients(); showToast('Bemor o\'chirildi', 'error'); }

// ─── Patient Profile ───
async function viewPatient(id) {
  const data = await api(`/api/patients/${id}`);
  if (!data) return;
  const initials = data.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
  const sevClass = s => s === 'yengil' ? 'badge-success' : s === "o'rtacha" ? 'badge-warning' : s === "og'ir" ? 'badge-danger' : 'badge-critical';
  document.getElementById('profile-content').innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">${initials}</div>
      <div class="profile-info">
        <h2>${data.full_name}</h2>
        <p>${data.gender} • Tug'ilgan: ${data.birth_date?.split('T')[0]}</p>
        <div class="profile-meta"><span>📞 ${data.phone || '—'}</span><span>📍 ${data.address || '—'}</span></div>
      </div>
    </div>
    <div class="profile-section"><h3>👨‍⚕️ Biriktirilgan shifokor</h3><p style="color:var(--text-secondary)"><strong>${data.doctor_name || '—'}</strong> — ${data.doctor_spec || ''}</p></div>
    <div class="profile-section"><h3>🦠 Kasallik tarixi (${data.diseases?.length || 0})</h3>
    ${data.diseases?.length ? `<div class="table-wrapper"><table><thead><tr><th>ICD</th><th>Kasallik</th><th>Og'irlik</th><th>Sana</th></tr></thead><tbody>
      ${data.diseases.map(d => `<tr><td><code>${d.icd_code}</code></td><td>${d.name}</td><td><span class="badge ${sevClass(d.severity)}">${d.severity}</span></td><td>${d.diagnosed_date?.split('T')[0]}</td></tr>`).join('')}
    </tbody></table></div>` : '<p style="color:var(--text-muted)">Kasallik yozuvlari topilmadi</p>'}</div>`;
  showPage('profile');
}

// ─── Diseases CRUD ───
async function loadDiseases() {
  const search = document.getElementById('disease-search').value;
  const data = await api(`/api/diseases?search=${encodeURIComponent(search)}`);
  const sevClass = s => s === 'yengil' ? 'badge-success' : s === "o'rtacha" ? 'badge-warning' : s === "og'ir" ? 'badge-danger' : 'badge-critical';
  document.getElementById('diseases-table').innerHTML = data?.map(d => `<tr>
    <td><code style="background:var(--bg);padding:2px 8px;border-radius:4px;font-size:12px">${d.icd_code}</code></td>
    <td><strong>${d.name}</strong></td><td>${d.patient_name || '—'}</td>
    <td><span class="badge ${sevClass(d.severity)}">${d.severity}</span></td>
    <td>${d.diagnosed_date?.split('T')[0] || ''}</td>
    <td class="table-actions">
      <button class="btn btn-ghost btn-sm" onclick="editDisease(${d.id})">✏️</button>
      <button class="btn btn-ghost btn-sm admin-only" onclick="deleteDisease(${d.id})" ${user.role!=='admin'?'style="display:none"':''}>🗑️</button>
    </td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px">Ma\'lumot topilmadi</td></tr>';
}
async function openDiseaseModal(dis = null) {
  document.getElementById('disease-modal-title').textContent = dis ? 'Tashxisni tahrirlash' : 'Yangi Tashxis';
  document.getElementById('disease-id').value = dis?.id || '';
  document.getElementById('disease-icd').value = dis?.icd_code || '';
  document.getElementById('disease-name').value = dis?.name || '';
  document.getElementById('disease-desc').value = dis?.description || '';
  document.getElementById('disease-severity').value = dis?.severity || 'yengil';
  document.getElementById('disease-date').value = dis?.diagnosed_date?.split('T')[0] || '';
  const patients = await api('/api/patients');
  document.getElementById('disease-patient').innerHTML = patients?.map(p => `<option value="${p.id}" ${dis?.patient_id==p.id?'selected':''}>${p.full_name}</option>`).join('') || '';
  document.getElementById('disease-modal').classList.add('active');
}
async function editDisease(id) { const d = await api(`/api/diseases/${id}`); if (d) openDiseaseModal(d); }
async function saveDisease() {
  const id = document.getElementById('disease-id').value;
  const body = { icd_code: document.getElementById('disease-icd').value, name: document.getElementById('disease-name').value, description: document.getElementById('disease-desc').value, severity: document.getElementById('disease-severity').value, patient_id: document.getElementById('disease-patient').value, diagnosed_date: document.getElementById('disease-date').value };
  await api(`/api/diseases${id ? '/'+id : ''}`, id ? 'PUT' : 'POST', body);
  closeModal('disease-modal'); loadDiseases();
  showToast(id ? 'Tashxis yangilandi' : 'Yangi tashxis qo\'shildi');
}
async function deleteDisease(id) { if (!confirm('O\'chirmoqchimisiz?')) return; await api(`/api/diseases/${id}`, 'DELETE'); loadDiseases(); showToast('Tashxis o\'chirildi', 'error'); }

// ─── Activity Log ───
async function loadActivity() {
  const data = await api('/api/activity');
  document.getElementById('activity-timeline').innerHTML = data?.map(a => {
    const date = new Date(a.created_at).toLocaleString('uz');
    return `<div class="timeline-item"><div class="time">${date}</div><div class="content"><strong>${a.user_name}</strong> ${a.action} — <span style="color:var(--primary)">${a.target}</span>: ${a.details || ''}</div></div>`;
  }).join('') || '<p style="color:var(--text-muted);text-align:center;padding:40px">Faoliyat topilmadi</p>';
}

// ─── Utilities ───
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('mobile-overlay').classList.toggle('active');
}

// ─── Dark Mode ───
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  document.querySelector('.theme-toggle').textContent = isDark ? '🌙' : '☀️';
}
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.addEventListener('DOMContentLoaded', () => { const t = document.querySelector('.theme-toggle'); if(t) t.textContent = '☀️'; });
}

// ─── Command Search (Ctrl+K) ───
const commands = [
  { name: 'Boshqaruv paneli', action: () => showPage('dashboard'), icon: '📊' },
  { name: 'Shifokorlar', action: () => showPage('doctors'), icon: '👨‍⚕️' },
  { name: 'Bemorlar', action: () => showPage('patients'), icon: '👥' },
  { name: 'Tashxislar', action: () => showPage('diseases'), icon: '🦠' },
  { name: 'Faoliyat jurnali', action: () => showPage('activity'), icon: '📋' },
  { name: 'Yangi shifokor qo\'shish', action: () => { showPage('doctors'); openDoctorModal(); }, icon: '➕' },
  { name: 'Yangi bemor qo\'shish', action: () => { showPage('patients'); openPatientModal(); }, icon: '➕' },
  { name: 'Yangi tashxis qo\'shish', action: () => { showPage('diseases'); openDiseaseModal(); }, icon: '➕' },
  { name: 'Mavzuni o\'zgartirish', action: () => toggleTheme(), icon: '🌙' },
  { name: 'Chiqish', action: () => logout(), icon: '🚪' },
];
function openCommand() {
  document.getElementById('command-overlay').classList.add('active');
  document.getElementById('command-input').value = '';
  document.getElementById('command-input').focus();
  filterCommands();
}
function closeCommand(e) { if (e.target.id === 'command-overlay') document.getElementById('command-overlay').classList.remove('active'); }
function filterCommands() {
  const q = document.getElementById('command-input').value.toLowerCase();
  const filtered = commands.filter(c => c.name.toLowerCase().includes(q));
  document.getElementById('command-results').innerHTML = filtered.map((c, i) => `<div class="command-item" onclick="runCommand(${i})">${c.icon} ${c.name}</div>`).join('');
}
function runCommand(i) { commands[i].action(); document.getElementById('command-overlay').classList.remove('active'); }
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCommand(); }
  if (e.key === 'Escape') document.getElementById('command-overlay').classList.remove('active');
});

// ─── CSV Export ───
function exportCSV() {
  const rows = document.querySelectorAll('#patients-table tr');
  let csv = 'Ism,Tug\'ilgan,Jinsi,Shifokor\n';
  rows.forEach(r => { const c = r.querySelectorAll('td'); if (c.length >= 4) csv += `${c[0].textContent},${c[1].textContent},${c[2].textContent},${c[3].textContent}\n`; });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'bemorlar.csv'; a.click();
  showToast('CSV yuklandi');
}

// ─── Print ───
function printProfile() {
  const content = document.getElementById('profile-content').innerHTML;
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>Bemor Profili</title><style>body{font-family:Inter,sans-serif;padding:40px;color:#0F172A}table{width:100%;border-collapse:collapse}th,td{padding:10px;border:1px solid #e2e8f0;text-align:left}th{background:#f5f7fa}.badge{padding:3px 8px;border-radius:10px;font-size:11px}h2{color:#1a365d}</style></head><body><h1>🏥 CareTrack Clinic</h1><hr style="border-color:#e2e8f0;margin:20px 0">${content}<script>window.print()<\/script></body></html>`);
}

// ─── Init ───
if (token && user) { showApp(); } else { document.getElementById('login-page').classList.remove('hidden'); }
