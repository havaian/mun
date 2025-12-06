// backend/src/utils/pdfGenerator.js
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class PDFGenerator {
    constructor() {
        this.pageWidth = 595.28; // A4 width in points
        this.pageHeight = 841.89; // A4 height in points
        this.margin = 50;
        this.contentWidth = this.pageWidth - (this.margin * 2);
    }

    // Generate complete QR codes PDF for a committee (presidium + delegates)
    async generateCommitteeQRPDF(committee, baseUrl = 'https://mun.uz') {
        return this.generateCompleteQRPDF(committee, [], baseUrl);
    }

    //  Generate presidium-only QR codes PDF
    async generatePresidiumQRPDF(committee, presidiumMembers, baseUrl = 'https://mun.uz') {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: this.margin,
                info: {
                    Title: `Presidium QR Codes - ${committee.name}`,
                    Author: 'MUN.UZ Platform',
                    Subject: `Presidium Authentication QR Codes for ${committee.name}`,
                    Keywords: 'MUN, QR Code, Authentication, Presidium',
                    Creator: 'MUN.UZ Platform'
                }
            });

            // Buffer to collect PDF data
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));

            let currentY = this.addHeader(doc, 'Presidium Authentication Codes');

            // Add presidium members
            const presidiumCardsPerRow = 2;
            const presidiumCardWidth = (this.contentWidth - 30) / presidiumCardsPerRow;
            const presidiumCardHeight = 180;
            const qrSpacing = 30;

            for (let i = 0; i < presidiumMembers.length; i++) {
                const member = presidiumMembers[i];
                const col = i % presidiumCardsPerRow;
                const row = Math.floor(i / presidiumCardsPerRow);

                // Check if we need a new page
                const requiredY = currentY + (row * (presidiumCardHeight + 20));
                if (requiredY + presidiumCardHeight > this.pageHeight - this.margin) {
                    doc.addPage();
                    currentY = this.addHeader(doc, 'Presidium Authentication Codes (Continued)');
                    row = 0;
                }

                const x = this.margin + (col * (presidiumCardWidth + qrSpacing));
                const y = currentY + (row * (presidiumCardHeight + 20));

                await this.addPresidiumCard(doc, x, y, member.presidiumRole, committee, presidiumCardWidth, presidiumCardHeight, 100, baseUrl, member.qrToken);
            }

            // Finalize PDF
            doc.end();

            // Return promise with PDF buffer
            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
                doc.on('error', reject);
            });

        } catch (error) {
            logger.error('Presidium PDF generation error:', error);
            throw new Error(`Failed to generate presidium PDF: ${error.message}`);
        }
    }

    //  Generate delegates-only QR codes PDF
    async generateDelegateQRPDF(committee, baseUrl = 'https://mun.uz') {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: this.margin,
                info: {
                    Title: `Delegate QR Codes - ${committee.name}`,
                    Author: 'MUN.UZ Platform',
                    Subject: `Delegate Authentication QR Codes for ${committee.name}`,
                    Keywords: 'MUN, QR Code, Authentication, Delegates',
                    Creator: 'MUN.UZ Platform'
                }
            });

            // Buffer to collect PDF data
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));

            let currentY = this.addHeader(doc, 'Delegate Authentication Codes');

            // Add delegates
            const delegatesPerPage = 12; // 3 columns x 4 rows
            const delegateCardsPerRow = 3;
            const delegateCardWidth = (this.contentWidth - (2 * 15)) / delegateCardsPerRow;
            const delegateCardHeight = 140;

            for (let i = 0; i < committee.countries.length; i++) {
                const country = committee.countries[i];
                const pageIndex = Math.floor(i / delegatesPerPage);
                const cardIndex = i % delegatesPerPage;
                const col = cardIndex % delegateCardsPerRow;
                const row = Math.floor(cardIndex / delegateCardsPerRow);

                // Add new page if needed
                if (cardIndex === 0 && i > 0) {
                    doc.addPage();
                    currentY = this.addHeader(doc, `Delegate Authentication Codes (Page ${pageIndex + 1})`);
                }

                const x = this.margin + (col * (delegateCardWidth + 15));
                const y = currentY + (row * (delegateCardHeight + 15));

                await this.addDelegateCard(doc, x, y, country, delegateCardWidth, delegateCardHeight, 80, baseUrl);
            }

            // Finalize PDF
            doc.end();

            // Return promise with PDF buffer
            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
                doc.on('error', reject);
            });

        } catch (error) {
            logger.error('Delegate PDF generation error:', error);
            throw new Error(`Failed to generate delegate PDF: ${error.message}`);
        }
    }

    //  Generate complete QR codes PDF (presidium + delegates)
    async generateCompleteQRPDF(committee, presidiumMembers = [], baseUrl = 'https://mun.uz') {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: this.margin,
                info: {
                    Title: `Complete QR Codes - ${committee.name}`,
                    Author: 'MUN.UZ Platform',
                    Subject: `Complete Authentication QR Codes for ${committee.name}`,
                    Keywords: 'MUN, QR Code, Authentication',
                    Creator: 'MUN.UZ Platform'
                }
            });

            // Buffer to collect PDF data
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));

            let currentY = this.addHeader(doc, 'Authentication Codes');

            // Add presidium members first (if any)
            if (presidiumMembers.length > 0) {
                const presidiumCardsPerRow = 2;
                const presidiumCardWidth = (this.contentWidth - 30) / presidiumCardsPerRow;
                const presidiumCardHeight = 180;

                for (let i = 0; i < presidiumMembers.length; i++) {
                    const member = presidiumMembers[i];
                    const col = i % presidiumCardsPerRow;
                    const row = Math.floor(i / presidiumCardsPerRow);

                    // Check if we need a new page
                    const requiredY = currentY + (row * (presidiumCardHeight + 20));
                    if (requiredY + presidiumCardHeight > this.pageHeight - this.margin) {
                        doc.addPage();
                        currentY = this.addHeader(doc, 'Presidium Authentication Codes');
                    }

                    const x = this.margin + (col * (presidiumCardWidth + 30));
                    const y = currentY + (row * (presidiumCardHeight + 20));

                    await this.addPresidiumCard(doc, x, y, member.presidiumRole, committee, presidiumCardWidth, presidiumCardHeight, 100, baseUrl, member.qrToken);
                }

                // Add new page for delegates
                doc.addPage();
                currentY = this.addHeader(doc, 'Delegate Authentication Codes');
            }

            // Add delegates
            const delegatesPerPage = 12; // 3 columns x 4 rows
            const delegateCardsPerRow = 3;
            const delegateCardWidth = (this.contentWidth - (2 * 15)) / delegateCardsPerRow;
            const delegateCardHeight = 140;

            for (let i = 0; i < committee.countries.length; i++) {
                const country = committee.countries[i];
                const pageIndex = Math.floor(i / delegatesPerPage);
                const cardIndex = i % delegatesPerPage;
                const col = cardIndex % delegateCardsPerRow;
                const row = Math.floor(cardIndex / delegateCardsPerRow);

                // Add new page if needed
                if (cardIndex === 0 && i > 0) {
                    doc.addPage();
                    currentY = this.addHeader(doc, `Delegate Authentication Codes (Page ${pageIndex + 1})`);
                }

                const x = this.margin + (col * (delegateCardWidth + 15));
                const y = currentY + (row * (delegateCardHeight + 15));

                await this.addDelegateCard(doc, x, y, country, delegateCardWidth, delegateCardHeight, 80, baseUrl);
            }

            // Finalize PDF
            doc.end();

            // Return promise with PDF buffer
            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
                doc.on('error', reject);
            });

        } catch (error) {
            logger.error('Complete PDF generation error:', error);
            throw new Error(`Failed to generate complete PDF: ${error.message}`);
        }
    }

    // Header function
    addHeader(doc, pageTitle) {
        doc.fontSize(20)
            .fillColor('#009edb')
            .text('MUN.UZ Platform', this.margin, this.margin, { align: 'center' });

        doc.fontSize(16)
            .fillColor('#333333')
            .text('Committee Authentication System', this.margin, this.margin + 30, { align: 'center' });

        doc.fontSize(14)
            .fillColor('#666666')
            .text(pageTitle, this.margin, this.margin + 55, { align: 'center' });

        // Horizontal line
        doc.strokeColor('#009edb')
            .lineWidth(2)
            .moveTo(this.margin, this.margin + 80)
            .lineTo(this.pageWidth - this.margin, this.margin + 80)
            .stroke();

        return this.margin + 100; // Return Y position for content
    }

    // Add presidium card to PDF
    async addPresidiumCard(doc, x, y, role, committee, cardWidth, cardHeight, qrSize, baseUrl, qrToken = null) {
        try {
            // Use provided token or generate new one
            const token = qrToken || this.generateQRToken();
            const qrUrl = `${baseUrl}/auth/qr/${token}`;

            // Generate QR code
            const qrDataURL = await QRCode.toDataURL(qrUrl, {
                width: qrSize,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // Card background
            doc.rect(x, y, cardWidth, cardHeight)
                .fillAndStroke('#f8f9fa', '#e9ecef');

            // Role title
            doc.fontSize(14)
                .fillColor('#009edb')
                .text(this.formatRole(role), x + 10, y + 10, {
                    width: cardWidth - 20,
                    align: 'center'
                });

            // Committee name
            doc.fontSize(10)
                .fillColor('#666666')
                .text(committee.name, x + 10, y + 35, {
                    width: cardWidth - 20,
                    align: 'center'
                });

            // QR Code
            const qrImage = qrDataURL.split(',')[1]; // Remove data:image/png;base64,
            const qrBuffer = Buffer.from(qrImage, 'base64');
            const qrX = x + (cardWidth - qrSize) / 2;
            const qrY = y + 55;

            doc.image(qrBuffer, qrX, qrY, { width: qrSize });

            // Instructions
            doc.fontSize(8)
                .fillColor('#666666')
                .text('Scan to authenticate as presidium', x + 10, y + cardHeight - 20, {
                    width: cardWidth - 20,
                    align: 'center'
                });

        } catch (error) {
            logger.error('Error adding presidium card:', error);
            // Add error placeholder
            doc.rect(x, y, cardWidth, cardHeight)
                .fillAndStroke('#fee', '#fcc');
            doc.fontSize(12)
                .fillColor('#c33')
                .text('QR Generation Error', x + 10, y + cardHeight / 2, {
                    width: cardWidth - 20,
                    align: 'center'
                });
        }
    }

    // Add delegate card to PDF
    async addDelegateCard(doc, x, y, country, cardWidth, cardHeight, qrSize, baseUrl) {
        try {
            const qrUrl = `${baseUrl}/auth/qr/${country.qrToken}`;

            // Generate QR code
            const qrDataURL = await QRCode.toDataURL(qrUrl, {
                width: qrSize,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // Card background
            doc.rect(x, y, cardWidth, cardHeight)
                .fillAndStroke('#f8f9fa', '#e9ecef');

            // Country name
            doc.fontSize(12)
                .fillColor('#009edb')
                .text(country.name, x + 5, y + 8, {
                    width: cardWidth - 10,
                    align: 'center'
                });

            // Special role indicator
            if (country.specialRole) {
                doc.fontSize(8)
                    .fillColor('#ff6600')
                    .text(`(${country.specialRole})`, x + 5, y + 25, {
                        width: cardWidth - 10,
                        align: 'center'
                    });
            }

            // QR Code
            const qrImage = qrDataURL.split(',')[1];
            const qrBuffer = Buffer.from(qrImage, 'base64');
            const qrX = x + (cardWidth - qrSize) / 2;
            const qrY = y + (country.specialRole ? 40 : 30);

            doc.image(qrBuffer, qrX, qrY, { width: qrSize });

            // Instructions
            doc.fontSize(7)
                .fillColor('#666666')
                .text('Scan to register', x + 5, y + cardHeight - 15, {
                    width: cardWidth - 10,
                    align: 'center'
                });

        } catch (error) {
            logger.error('Error adding delegate card:', error);
            // Add error placeholder
            doc.rect(x, y, cardWidth, cardHeight)
                .fillAndStroke('#fee', '#fcc');
            doc.fontSize(10)
                .fillColor('#c33')
                .text('QR Error', x + 5, y + cardHeight / 2, {
                    width: cardWidth - 10,
                    align: 'center'
                });
        }
    }

    // Helper function to format presidium roles
    formatRole(role) {
        const roleMap = {
            'chairman': 'Chairman',
            'co-chairman': 'Co-Chairman',
            'expert': 'Expert',
            'secretary': 'Secretary'
        };
        return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
    }

    // Generate QR token
    generateQRToken() {
        return require('crypto').randomBytes(32).toString('hex');
    }
}

module.exports = PDFGenerator;