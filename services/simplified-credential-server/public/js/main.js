// Simplified Credential Server - Client-side JavaScript
console.log('Simplified Credential Server loaded');

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    setupFormHandlers();
    checkSystemStatus();
    setupUIInteractions();
}

// Setup Form Event Handlers
function setupFormHandlers() {
    // Invitation Form Handler
    const invitationForm = document.getElementById('invitation-form');
    if (invitationForm) {
        invitationForm.addEventListener('submit', handleInvitationSubmission);
    }

    // Credential Form Handler
    const credentialForm = document.getElementById('credential-form');
    if (credentialForm) {
        credentialForm.addEventListener('submit', handleCredentialSubmission);
    }
}

// Handle Invitation Form Submission
async function handleInvitationSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const invitationType = formData.get('invitationType');
    const label = formData.get('label');

    try {
        showLoading('invitation-form');
        hideMessages();

        // Use GET request as per API routes
        let url = '/api/invitation';
        if (invitationType === 'custom' || label) {
            url = '/api/invitation/custom';
            if (label) {
                url += `?issuerName=${encodeURIComponent(label)}`;
            }
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            displayInvitationResult(result.data);
            showSuccessMessage('Invitation generated successfully!');
        } else {
            throw new Error(result.error || 'Failed to generate invitation');
        }
    } catch (error) {
        console.error('Invitation generation error:', error);
        showErrorMessage(error.message || 'Failed to generate invitation');
    } finally {
        hideLoading('invitation-form');
    }
}

// Handle Credential Form Submission
async function handleCredentialSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Validate JSON attributes
    let attributes;
    try {
        attributes = JSON.parse(formData.get('attributes'));
    } catch (error) {
        showErrorMessage('Invalid JSON format in credential attributes');
        return;
    }

    const credentialData = {
        recipientId: formData.get('recipientId'),
        schemaId: formData.get('schemaId'),
        credentialType: formData.get('credentialType'),
        attributes: attributes
    };

    try {
        showLoading('credential-form');
        hideMessages();

        const response = await fetch('/api/credential', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentialData)
        });

        const result = await response.json();

        if (response.ok) {
            displayCredentialResult(result);
            showSuccessMessage('Credential issued successfully!');
            document.getElementById('credential-form').reset();
        } else {
            throw new Error(result.error || 'Failed to issue credential');
        }
    } catch (error) {
        console.error('Credential issuance error:', error);
        showErrorMessage(error.message || 'Failed to issue credential');
    } finally {
        hideLoading('credential-form');
    }
}

// Display Invitation Result
function displayInvitationResult(result) {
    const resultSection = document.getElementById('invitation-result');
    const oobiTextarea = document.getElementById('invitation-oobi');
    const qrContainer = document.getElementById('qr-code-container');

    if (result && result.oobi) {
        oobiTextarea.value = result.oobi;
        
        // Generate QR Code (using a simple text-based approach for now)
        generateQRCode(result.oobi, qrContainer);
        
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Display Credential Result
function displayCredentialResult(result) {
    const resultSection = document.getElementById('credential-result');
    
    document.getElementById('credential-id').textContent = result.credentialId || result.message || 'N/A';
    document.getElementById('issued-to').textContent = result.recipientId || 'N/A';
    document.getElementById('issue-date').textContent = result.timestamp || new Date().toLocaleString();
    
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Generate QR Code (Simple implementation)
function generateQRCode(text, container) {
    // For now, display the text. In a real implementation, you'd use a QR code library
    container.innerHTML = `
        <div style="
            width: 200px; 
            height: 200px; 
            border: 2px solid #333; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 12px; 
            word-break: break-all; 
            padding: 10px;
            background: white;
        ">
            <div style="text-align: center;">
                <div style="font-weight: bold; margin-bottom: 10px;">QR Code</div>
                <div style="font-size: 10px; opacity: 0.7;">
                    ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}
                </div>
            </div>
        </div>
    `;
}

// Validate JSON Function
function validateJSON() {
    const textarea = document.getElementById('credential-attributes');
    const value = textarea.value.trim();
    
    if (!value) {
        showErrorMessage('Please enter credential attributes');
        return false;
    }
    
    try {
        const parsed = JSON.parse(value);
        showSuccessMessage('JSON is valid!');
        
        // Pretty format the JSON
        textarea.value = JSON.stringify(parsed, null, 2);
        return true;
    } catch (error) {
        showErrorMessage('Invalid JSON: ' + error.message);
        return false;
    }
}

// Copy to Clipboard Function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.select();
        element.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            showSuccessMessage('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            showErrorMessage('Failed to copy to clipboard');
        }
    }
}

// Message Display Functions
function showSuccessMessage(message) {
    const container = document.getElementById('message-container');
    const successMsg = document.getElementById('success-message');
    const successText = document.getElementById('success-text');
    
    successText.textContent = message;
    successMsg.style.display = 'flex';
    container.style.display = 'block';
    
    // Hide error message
    document.getElementById('error-message').style.display = 'none';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        successMsg.style.display = 'none';
        if (document.getElementById('error-message').style.display === 'none') {
            container.style.display = 'none';
        }
    }, 5000);
}

function showErrorMessage(message) {
    const container = document.getElementById('message-container');
    const errorMsg = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorMsg.style.display = 'flex';
    container.style.display = 'block';
    
    // Hide success message
    document.getElementById('success-message').style.display = 'none';
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        errorMsg.style.display = 'none';
        if (document.getElementById('success-message').style.display === 'none') {
            container.style.display = 'none';
        }
    }, 8000);
}

function hideMessages() {
    const container = document.getElementById('message-container');
    const successMsg = document.getElementById('success-message');
    const errorMsg = document.getElementById('error-message');
    
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    container.style.display = 'none';
}

// Loading State Functions
function showLoading(formId) {
    const form = document.getElementById(formId);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
}

function hideLoading(formId) {
    const form = document.getElementById(formId);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (submitBtn) {
        submitBtn.disabled = false;
        
        // Restore original button text based on form
        if (formId === 'invitation-form') {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Generate Invitation';
        } else if (formId === 'credential-form') {
            submitBtn.innerHTML = '<i class="fas fa-certificate"></i> Issue Credential';
        }
    }
}

// System Status Check
async function checkSystemStatus() {
    try {
        // Check KERIA status
        updateStatusIndicator('keria-status', 'checking', 'Checking connection...');
        
        // Check Signify status
        updateStatusIndicator('signify-status', 'checking', 'Checking connection...');
        
        // Make API call to check system status
        const response = await fetch('/api/status');
        const status = await response.json();
        
        // Update KERIA status
        if (status.keria) {
            updateStatusIndicator('keria-status', 'online', 'Connected and ready');
        } else {
            updateStatusIndicator('keria-status', 'offline', 'Connection failed');
        }
        
        // Update Signify status
        if (status.signify) {
            updateStatusIndicator('signify-status', 'online', 'Connected and ready');
        } else {
            updateStatusIndicator('signify-status', 'offline', 'Connection failed');
        }
        
    } catch (error) {
        console.error('Status check failed:', error);
        updateStatusIndicator('keria-status', 'offline', 'Status check failed');
        updateStatusIndicator('signify-status', 'offline', 'Status check failed');
    }
}

// Update Status Indicator
function updateStatusIndicator(indicatorId, status, message) {
    const indicator = document.getElementById(indicatorId);
    const statusText = document.getElementById(indicatorId.replace('-status', '-status-text'));
    
    if (indicator && statusText) {
        // Remove existing status classes
        indicator.classList.remove('online', 'offline', 'checking');
        
        // Add new status class
        indicator.classList.add(status);
        
        // Update status text
        statusText.textContent = message;
    }
}

// Setup UI Interactions
function setupUIInteractions() {
    // Auto-resize textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    });
    
    // Form validation feedback
    const inputs = document.querySelectorAll('input[required], textarea[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#e74c3c';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
        
        input.addEventListener('input', function() {
            if (this.style.borderColor === 'rgb(231, 76, 60)') { // #e74c3c
                this.style.borderColor = '#e9ecef';
            }
        });
    });
}

// Utility Functions
function formatDate(date) {
    return new Date(date).toLocaleString();
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Export functions for global access
window.validateJSON = validateJSON;
window.copyToClipboard = copyToClipboard;