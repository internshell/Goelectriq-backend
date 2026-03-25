import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate invoice PDF for a booking
 */
export const generateInvoicePDF = async (booking, user) => {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate invoice number if not exists
      const invoiceNumber = booking.invoice?.invoiceNumber || `INV-${booking.bookingId}`;
      const filename = `${invoiceNumber}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Company details
      doc.fontSize(12).font('Helvetica-Bold').text('Electric Cab Jaipur');
      doc.fontSize(10).font('Helvetica')
        .text('Pink City Plaza, MI Road')
        .text('Jaipur, Rajasthan - 302001')
        .text('Phone: +91-9876543210')
        .text('Email: support@electriccab.com')
        .text('GSTIN: 08AAAAA0000A1Z5');
      
      doc.moveDown();

      // Invoice details
      doc.fontSize(10).font('Helvetica-Bold').text(`Invoice Number: ${invoiceNumber}`);
      doc.font('Helvetica').text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`);
      doc.text(`Booking ID: ${booking.bookingId}`);
      
      doc.moveDown();

      // Customer details
      doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:');
      doc.fontSize(10).font('Helvetica')
        .text(user.name)
        .text(`Email: ${user.email}`)
        .text(`Phone: ${user.phone}`);
      
      doc.moveDown();

      // Ride details
      doc.fontSize(12).font('Helvetica-Bold').text('RIDE DETAILS:');
      doc.fontSize(10).font('Helvetica')
        .text(`Date: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN')}`)
        .text(`Time: ${booking.scheduledTime}`)
        .text(`Cab Type: ${booking.cabType.toUpperCase()}`)
        .text(`From: ${booking.pickupLocation.address}`)
        .text(`To: ${booking.dropLocation.address}`)
        .text(`Distance: ${booking.distance} km`);
      
      doc.moveDown();

      // Fare breakdown table
      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 400;

      doc.fontSize(12).font('Helvetica-Bold').text('FARE BREAKDOWN:', col1X, tableTop);
      doc.moveDown();

      const itemsStartY = doc.y;
      
      // Table headers
      doc.fontSize(10).font('Helvetica-Bold')
        .text('Description', col1X, itemsStartY)
        .text('Amount', col2X, itemsStartY, { width: 100, align: 'right' });
      
      doc.moveTo(col1X, itemsStartY + 15)
        .lineTo(col2X + 100, itemsStartY + 15)
        .stroke();

      let currentY = itemsStartY + 25;

      // Fare items
      const fareItems = [
        { label: 'Base Fare', amount: booking.pricing.baseFare },
        { label: `Distance Charge (${booking.distance} km @ ₹${booking.pricing.perKmRate}/km)`, amount: booking.pricing.distanceCharge },
      ];

      if (booking.pricing.nightCharge > 0) {
        fareItems.push({ label: 'Night Charges', amount: booking.pricing.nightCharge });
      }

      if (booking.pricing.waitingCharge > 0) {
        fareItems.push({ label: 'Waiting Charges', amount: booking.pricing.waitingCharge });
      }

      if (booking.pricing.surgeCharge > 0) {
        fareItems.push({ label: 'Surge Charges', amount: booking.pricing.surgeCharge });
      }

      // Draw fare items
      doc.font('Helvetica');
      fareItems.forEach(item => {
        doc.text(item.label, col1X, currentY)
          .text(`₹${item.amount.toFixed(2)}`, col2X, currentY, { width: 100, align: 'right' });
        currentY += 20;
      });

      // Subtotal
      doc.moveTo(col1X, currentY)
        .lineTo(col2X + 100, currentY)
        .stroke();
      currentY += 10;

      const subtotal = booking.pricing.baseFare + booking.pricing.distanceCharge + 
                      booking.pricing.nightCharge + booking.pricing.waitingCharge + 
                      booking.pricing.surgeCharge;

      doc.font('Helvetica-Bold')
        .text('Subtotal', col1X, currentY)
        .text(`₹${subtotal.toFixed(2)}`, col2X, currentY, { width: 100, align: 'right' });
      currentY += 20;

      // GST
      doc.font('Helvetica')
        .text(`GST (5%)`, col1X, currentY)
        .text(`₹${booking.pricing.gst.toFixed(2)}`, col2X, currentY, { width: 100, align: 'right' });
      currentY += 20;

      // Discount if any
      if (booking.pricing.discount > 0) {
        doc.text('Discount', col1X, currentY)
          .text(`-₹${booking.pricing.discount.toFixed(2)}`, col2X, currentY, { width: 100, align: 'right' });
        currentY += 20;
      }

      // Total
      doc.moveTo(col1X, currentY)
        .lineTo(col2X + 100, currentY)
        .stroke();
      currentY += 10;

      doc.fontSize(12).font('Helvetica-Bold')
        .text('TOTAL AMOUNT', col1X, currentY)
        .text(`₹${booking.pricing.totalFare.toFixed(2)}`, col2X, currentY, { width: 100, align: 'right' });

      currentY += 30;

      // Payment status
      doc.fontSize(10).font('Helvetica')
        .text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`, col1X, currentY)
        .text(`Payment Method: ${booking.paymentMethod.toUpperCase()}`, col1X, currentY + 15);

      // Footer
      doc.fontSize(8).font('Helvetica')
        .text('Thank you for choosing Electric Cab Jaipur!', 50, 700, { align: 'center' })
        .text('For any queries, contact us at support@electriccab.com or call +91-9876543210', 50, 715, { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve({
          filepath,
          filename,
          invoiceNumber,
        });
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
};

/**
 * Generate ride receipt PDF
 */
export const generateRideReceiptPDF = async (booking, user, driver) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const receiptNumber = `REC-${booking.bookingId}`;
      const filename = `${receiptNumber}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Title
      doc.fontSize(20).text('RIDE RECEIPT', { align: 'center' });
      doc.moveDown();

      // Receipt details
      doc.fontSize(10)
        .text(`Receipt Number: ${receiptNumber}`)
        .text(`Booking ID: ${booking.bookingId}`)
        .text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
      
      doc.moveDown();

      // Customer details
      doc.fontSize(12).font('Helvetica-Bold').text('CUSTOMER:');
      doc.fontSize(10).font('Helvetica').text(user.name).text(user.phone);
      doc.moveDown();

      // Driver details if available
      if (driver) {
        doc.fontSize(12).font('Helvetica-Bold').text('DRIVER:');
        doc.fontSize(10).font('Helvetica')
          .text(driver.name)
          .text(driver.phone)
          .text(`Vehicle: ${driver.vehicleDetails.vehicleNumber}`);
        doc.moveDown();
      }

      // Ride summary
      doc.fontSize(12).font('Helvetica-Bold').text('RIDE SUMMARY:');
      doc.fontSize(10).font('Helvetica')
        .text(`From: ${booking.pickupLocation.address}`)
        .text(`To: ${booking.dropLocation.address}`)
        .text(`Distance: ${booking.rideDetails?.actualDistance || booking.distance} km`)
        .text(`Duration: ${booking.rideDetails?.actualDuration || booking.duration} minutes`)
        .text(`Start Time: ${booking.rideDetails?.startTime ? new Date(booking.rideDetails.startTime).toLocaleString('en-IN') : 'N/A'}`)
        .text(`End Time: ${booking.rideDetails?.endTime ? new Date(booking.rideDetails.endTime).toLocaleString('en-IN') : 'N/A'}`);
      
      doc.moveDown();

      // Amount
      doc.fontSize(14).font('Helvetica-Bold')
        .text(`TOTAL AMOUNT: ₹${booking.pricing.totalFare.toFixed(2)}`);

      doc.end();

      stream.on('finish', () => {
        resolve({ filepath, filename, receiptNumber });
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generateInvoicePDF,
  generateRideReceiptPDF,
};