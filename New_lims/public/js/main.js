// Main JavaScript file for LIMS application

// Add Font Awesome for icons
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
document.head.appendChild(fontAwesomeLink);

// DOM Elements
const mainContent = document.getElementById('mainContent');
const navLinks = document.querySelectorAll('.nav-link');
const sidebarCollapse = document.getElementById('sidebarCollapse');
const sidebar = document.getElementById('sidebar');
const logoutButton = document.getElementById('logout');
const userName = document.getElementById('userName');

// Check authentication
function checkAuth() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    userName.textContent = user.username;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
    setupNavigation();
});

// Toggle Sidebar
sidebarCollapse.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Logout handler
logoutButton.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        sessionStorage.removeItem('user');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Navigation Setup
function setupNavigation() {
    navLinks.forEach(link => {
        if (link.id !== 'logout') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.closest('.nav-link').dataset.page;
                loadPage(page);
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                e.target.closest('.nav-link').classList.add('active');
            });
        }
    });
}

// Data Loading Functions
async function loadDashboardData() {
    try {
        // Load Leads Count
        const leadsResponse = await fetch('/api/leads');
        const leadsData = await leadsResponse.json();
        document.getElementById('totalLeads').textContent = leadsData.length;

        // Load Active Samples
        const samplesResponse = await fetch('/api/samples');
        const samplesData = await samplesResponse.json();
        const activeSamples = samplesData.filter(sample => sample.status === 'active');
        document.getElementById('activeSamples').textContent = activeSamples.length;

        // Load Pending Reports
        const reportsResponse = await fetch('/api/reports');
        const reportsData = await reportsResponse.json();
        const pendingReports = reportsData.filter(report => report.status === 'pending');
        document.getElementById('pendingReports').textContent = pendingReports.length;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Page Loading Functions
function loadPage(pageName) {
    // Remove active class from all links
    navLinks.forEach(link => link.classList.remove('active'));
    // Add active class to clicked link
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    if (pageName === 'leads') {
        loadLeadsContent();
    }
}

async function loadLeadsContent() {
    try {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="container-fluid">
                <h2>Lead Management</h2>
                <div class="mb-3">
                    <button class="btn btn-primary" onclick="openAddLeadModal()">Add New Lead</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Company</th>
                                <th>Contact Person</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="leadsTableBody"></tbody>
                    </table>
                </div>
            </div>
            
            <!-- Add Lead Modal -->
            <div class="modal fade" id="addLeadModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New Lead</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addLeadForm">
                                <div class="mb-3">
                                    <label class="form-label">Company Name</label>
                                    <input type="text" class="form-control" name="company_name" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Contact Person</label>
                                    <input type="text" class="form-control" name="contact_person" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" name="email" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Phone</label>
                                    <input type="tel" class="form-control" name="phone" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Location</label>
                                    <input type="text" class="form-control" name="location">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Lead Source</label>
                                    <select class="form-control" name="lead_source">
                                        <option value="Website">Website</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Direct">Direct</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Status</label>
                                    <select class="form-control" name="lead_status">
                                        <option value="New">New</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Deal Won">Deal Won</option>
                                        <option value="Lost">Lost</option>
                                        <option value="Cold">Cold</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Remarks</label>
                                    <textarea class="form-control" name="remarks"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="saveLead()">Save Lead</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load leads data
        await loadLeadsData();
    } catch (error) {
        console.error('Error loading leads page:', error);
        showNotification('error', 'Failed to load leads page');
    }
}

async function loadLeadsData() {
    try {
        const response = await fetch('/api/leads');
        const leads = await response.json();
        
        const tbody = document.getElementById('leadsTableBody');
        tbody.innerHTML = '';
        
        leads.forEach(lead => {
            tbody.innerHTML += `
                <tr>
                    <td>${lead.id}</td>
                    <td>${lead.company_name || ''}</td>
                    <td>${lead.contact_person || ''}</td>
                    <td>${lead.email || ''}</td>
                    <td>${lead.phone || ''}</td>
                    <td>
                        <span class="badge bg-${getStatusColor(lead.lead_status)}">
                            ${lead.lead_status || 'New'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editLead(${lead.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLead(${lead.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading leads:', error);
        showNotification('error', 'Failed to load leads');
    }
}

function getStatusColor(status) {
    const colors = {
        'New': 'primary',
        'In Progress': 'warning',
        'Deal Won': 'success',
        'Lost': 'danger',
        'Cold': 'secondary'
    };
    return colors[status] || 'secondary';
}

function openAddLeadModal() {
    const modal = new bootstrap.Modal(document.getElementById('addLeadModal'));
    modal.show();
}

async function saveLead() {
    try {
        const form = document.getElementById('addLeadForm');
        const formData = new FormData(form);
        const leadData = Object.fromEntries(formData.entries());
        
        const response = await fetch('/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadData)
        });
        
        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('addLeadModal'));
            modal.hide();
            form.reset();
            await loadLeadsData();
            showNotification('success', 'Lead added successfully');
        } else {
            throw new Error('Failed to add lead');
        }
    } catch (error) {
        console.error('Error saving lead:', error);
        showNotification('error', 'Failed to save lead');
    }
}

async function editLead(id) {
    try {
        const response = await fetch(`/api/leads/${id}`);
        const lead = await response.json();
        
        // Store the original status
        const originalStatus = lead.lead_status;
        
        // Populate the form
        const form = document.getElementById('addLeadForm');
        Object.keys(lead).forEach(key => {
            const input = form.elements[key];
            if (input) {
                input.value = lead[key];
            }
        });
        
        // Update the save button to handle status change
        const saveButton = document.querySelector('#addLeadModal .btn-primary');
        saveButton.onclick = async () => {
            const formData = new FormData(form);
            const updatedLead = Object.fromEntries(formData.entries());
            
            // Check if status changed to "Deal Won"
            if (originalStatus !== 'Deal Won' && updatedLead.lead_status === 'Deal Won') {
                // Create a sample entry when deal is won
                try {
                    await createSampleFromLead(lead);
                    showNotification('success', 'Lead converted to sample successfully');
                } catch (error) {
                    console.error('Error creating sample:', error);
                    showNotification('error', 'Failed to create sample');
                }
            }
            
            // Update the lead
            const updateResponse = await fetch(`/api/leads/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedLead)
            });
            
            if (updateResponse.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addLeadModal'));
                modal.hide();
                await loadLeadsData();
                showNotification('success', 'Lead updated successfully');
            } else {
                throw new Error('Failed to update lead');
            }
        };
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('addLeadModal'));
        modal.show();
    } catch (error) {
        console.error('Error editing lead:', error);
        showNotification('error', 'Failed to load lead details');
    }
}

// Function to create a sample from a lead
async function createSampleFromLead(lead) {
    const sampleData = {
        company_name: lead.company_name,
        contact_person: lead.contact_person,
        email: lead.email,
        phone: lead.phone,
        lead_id: lead.id,
        status: 'new',
        sample_type: 'pending',
        created_at: new Date().toISOString()
    };

    const response = await fetch('/api/samples', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sampleData)
    });

    if (!response.ok) {
        throw new Error('Failed to create sample');
    }

    return response.json();
}

async function deleteLead(id) {
    if (confirm('Are you sure you want to delete this lead?')) {
        try {
            const response = await fetch(`/api/leads/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await loadLeadsData();
                showNotification('success', 'Lead deleted successfully');
            } else {
                throw new Error('Failed to delete lead');
            }
        } catch (error) {
            console.error('Error deleting lead:', error);
            showNotification('error', 'Failed to delete lead');
        }
    }
}

function showNotification(type, message) {
    // You can implement a better notification system here
    alert(message);
}

// Load page content based on name
function loadPage(pageName) {
    switch(pageName) {
        case 'dashboard':
            loadDashboardContent();
            break;
        case 'leads':
            loadLeadsContent();
            break;
        case 'samples':
            loadSamplesContent();
            break;
        case 'reports':
            loadReportsContent();
            break;
    }
}

// Placeholder functions for other content
function loadDashboardContent() {
    mainContent.innerHTML = '<h2>Dashboard</h2><p>Dashboard content coming soon...</p>';
}

async function loadSamplesContent() {
    try {
        const response = await fetch('/api/samples');
        const samples = await response.json();
        
        mainContent.innerHTML = `
            <div class="container-fluid">
                <h2>Sample Management</h2>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Company</th>
                                <th>Contact Person</th>
                                <th>Sample Type</th>
                                <th>Status</th>
                                <th>Created Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${samples.map(sample => `
                                <tr>
                                    <td>${sample.id}</td>
                                    <td>${sample.company_name}</td>
                                    <td>${sample.contact_person}</td>
                                    <td>${sample.sample_type}</td>
                                    <td>
                                        <span class="badge bg-${getSampleStatusColor(sample.status)}">
                                            ${sample.status}
                                        </span>
                                    </td>
                                    <td>${new Date(sample.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="editSample(${sample.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading samples:', error);
        showNotification('error', 'Failed to load samples');
    }
}

function getSampleStatusColor(status) {
    const colors = {
        'new': 'primary',
        'in_progress': 'warning',
        'completed': 'success',
        'rejected': 'danger'
    };
    return colors[status] || 'secondary';
}

function loadReportsContent() {
    mainContent.innerHTML = '<h2>Reports</h2><p>Reports content coming soon...</p>';
}
