import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/GoElectriQ').then(async () => {
  try {
    const db = mongoose.connection.db;
    
    // Find Puskar temple package
    const puskarPackage = await db.collection('packages').findOne({ title: 'Puskar temple' });
    console.log('📦 Puskar temple Package ID:', puskarPackage._id);
    
    // Get all bookings for this package
    const bookings = await db.collection('tourbookings')
      .find({ package: puskarPackage._id })
      .toArray();
    
    console.log('\n📋 Found', bookings.length, 'Puskar temple bookings\n');
    
    // For each booking, check the pricing and payment data
    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Booking ${i + 1}:`);
      console.log(`ID: ${booking._id}`);
      console.log(`CarType: ${booking.carType}`);
      console.log(`Pricing Object:`, JSON.stringify(booking.pricing, null, 2));
      console.log(`PaymentStatus: ${booking.paymentStatus}`);
      console.log(`PaymentOption: ${booking.paymentOption}`);
      
      // Check Payment collection for this booking
      const payments = await db.collection('payments')
        .find({ tourBooking: booking._id })
        .toArray();
      
      if (payments.length > 0) {
        console.log(`\nPayment Records (${payments.length}):`);
        payments.forEach((p, idx) => {
          console.log(`  ${idx + 1}. Amount: ₹${p.amount}, Status: ${p.status}, Method: ${p.paymentMethod}, Date: ${p.paidAt}`);
        });
        const totalPaid = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
        console.log(`  Total Paid (Success): ₹${totalPaid}`);
      } else {
        console.log('Payment Records: None');
      }
    }
    
    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    mongoose.disconnect();
  }
});
