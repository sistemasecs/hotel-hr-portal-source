-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    request_type TEXT NOT NULL, -- e.g., 'Vacation', 'Permission'
    content TEXT NOT NULL,      -- HTML template with placeholders
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create request_documents table
CREATE TABLE IF NOT EXISTS request_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES employee_requests(id) ON DELETE CASCADE,
    template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
    content TEXT NOT NULL,      -- Rendered HTML content
    is_signed BOOLEAN DEFAULT FALSE,
    signature_data TEXT,        -- Base64 or JSON signature data
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(request_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_request_documents_request_id ON request_documents(request_id);
