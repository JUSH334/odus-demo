// backend/medical-records-api.js
// Add these endpoints to your existing server.js

const multer = require('multer');
const { create } = require('ipfs-http-client');
const crypto = require('crypto');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
        }
    }
});

// IPFS client configuration (optional - for decentralized storage)
let ipfsClient;
try {
    ipfsClient = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https'
    });
    console.log('✅ IPFS client initialized');
} catch (error) {
    console.log('⚠️ IPFS client not available, using local encryption only');
}

// Medical Record Schema
const medicalRecordSchema = new mongoose.Schema({
    recordId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    memberID: {
        type: String,
        required: true,
        index: true
    },
    patientAddress: {
        type: String,
        required: true,
        index: true
    },
    recordType: {
        type: String,
        required: true,
        enum: ['lab', 'prescription', 'imaging', 'visit', 'vaccination', 'surgery', 'discharge', 'other']
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    fileName: String,
    fileSize: Number,
    fileType: String,
    encryptedData: {
        type: String,
        required: true
    },
    encryptionIV: {
        type: String,
        required: true
    },
    dataHash: {
        type: String,
        required: true
    },
    ipfsHash: String, // Optional: IPFS CID if uploaded to IPFS
    blockchainTxHash: String,
    blockchainConfirmed: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

// ============= ENCRYPTION UTILITIES =============

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

function encryptData(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return {
        encryptedData: encrypted.toString('hex'),
        iv: iv.toString('hex')
    };
}

function decryptData(encryptedData, iv) {
    const encryptedBuffer = Buffer.from(encryptedData, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, ivBuffer);
    
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
}

function generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// ============= API ENDPOINTS =============

// Upload medical record
app.post('/api/medical-records/upload', upload.single('file'), async (req, res) => {
    try {
        const { memberID, recordType, title, description, patientAddress } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Validate patient
        const patient = await Patient.findOne({ memberID });
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }

        // Generate record ID
        const recordId = 'REC-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        // Encrypt file data
        const { encryptedData, iv } = encryptData(file.buffer);

        // Generate hash
        const dataHash = generateHash(file.buffer);

        // Optional: Upload to IPFS
        let ipfsHash = null;
        if (ipfsClient) {
            try {
                const ipfsResult = await ipfsClient.add(file.buffer);
                ipfsHash = ipfsResult.path;
                console.log('📦 Uploaded to IPFS:', ipfsHash);
            } catch (error) {
                console.error('IPFS upload failed:', error.message);
            }
        }

        // Save to database
        const medicalRecord = await MedicalRecord.create({
            recordId,
            memberID,
            patientAddress: patientAddress || patient.walletAddress,
            recordType,
            title,
            description,
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            encryptedData,
            encryptionIV: iv,
            dataHash,
            ipfsHash,
            metadata: {
                uploadedBy: 'patient',
                userAgent: req.headers['user-agent']
            }
        });

        // Log event
        await Event.create({
            eventType: 'medical_record:uploaded',
            memberID,
            data: {
                recordId,
                recordType,
                title,
                fileSize: file.size,
                dataHash,
                ipfsHash
            }
        });

        res.json({
            success: true,
            message: 'Medical record uploaded successfully',
            data: {
                recordId: medicalRecord.recordId,
                recordType: medicalRecord.recordType,
                title: medicalRecord.title,
                fileName: medicalRecord.fileName,
                fileSize: medicalRecord.fileSize,
                dataHash: medicalRecord.dataHash,
                ipfsHash: medicalRecord.ipfsHash,
                uploadedAt: medicalRecord.uploadedAt
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get patient's medical records
app.get('/api/medical-records/:memberID', async (req, res) => {
    try {
        const { memberID } = req.params;

        const records = await MedicalRecord.find({ memberID, isActive: true })
            .select('-encryptedData -encryptionIV')
            .sort({ uploadedAt: -1 });

        res.json({
            success: true,
            count: records.length,
            data: records
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Download/decrypt medical record
app.get('/api/medical-records/:recordId/download', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { memberID } = req.query;

        // Find record
        const record = await MedicalRecord.findOne({ recordId });
        
        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        // Verify ownership
        if (record.memberID !== memberID) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized access'
            });
        }

        // Decrypt data
        const decryptedData = decryptData(record.encryptedData, record.encryptionIV);

        // Set headers
        res.setHeader('Content-Type', record.fileType);
        res.setHeader('Content-Disposition', `attachment; filename="${record.fileName}"`);
        res.setHeader('Content-Length', decryptedData.length);

        // Send file
        res.send(decryptedData);

        // Log access
        await Event.create({
            eventType: 'medical_record:accessed',
            memberID: record.memberID,
            data: { recordId, accessedAt: new Date() }
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update blockchain confirmation
app.post('/api/medical-records/:recordId/confirm-blockchain', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { txHash } = req.body;

        const record = await MedicalRecord.findOneAndUpdate(
            { recordId },
            {
                blockchainTxHash: txHash,
                blockchainConfirmed: true
            },
            { new: true }
        );

        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        res.json({
            success: true,
            message: 'Blockchain confirmation updated',
            data: {
                recordId: record.recordId,
                txHash: record.blockchainTxHash,
                confirmed: record.blockchainConfirmed
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Deactivate medical record
app.delete('/api/medical-records/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { memberID } = req.body;

        const record = await MedicalRecord.findOne({ recordId });

        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        // Verify ownership
        if (record.memberID !== memberID) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        record.isActive = false;
        await record.save();

        // Log event
        await Event.create({
            eventType: 'medical_record:deactivated',
            memberID,
            data: { recordId }
        });

        res.json({
            success: true,
            message: 'Record deactivated successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get medical records statistics
app.get('/api/medical-records/stats/:memberID', async (req, res) => {
    try {
        const { memberID } = req.params;

        const totalRecords = await MedicalRecord.countDocuments({ memberID, isActive: true });
        
        const recordsByType = await MedicalRecord.aggregate([
            { $match: { memberID, isActive: true } },
            { $group: { _id: '$recordType', count: { $sum: 1 } } }
        ]);

        const totalSize = await MedicalRecord.aggregate([
            { $match: { memberID, isActive: true } },
            { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalRecords,
                recordsByType,
                totalSize: totalSize[0]?.total || 0,
                totalSizeMB: ((totalSize[0]?.total || 0) / (1024 * 1024)).toFixed(2)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = {
    MedicalRecord,
    encryptData,
    decryptData,
    generateHash
};
