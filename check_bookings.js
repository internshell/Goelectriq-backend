import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/GoElectriQ').then(async () => {
  try {
    const db = mongoose.connection.db;
    const packages = await db.collection('packages').findOne({ title: 'Puskar temple' });
    console.log('Package Puskar temple:', JSON.stringify(packages, null, 2));
    
    const bookings = await db.collection('tourbookings').find({ package: packages._id }).limit(3).toArray();
    console.log('\nBookings for Puskar temple:');
    bookings.forEach((b, i) => {
      console.log(`\n${i + 1}. carType: ${b.carType}, totalAmount in pricing: ${b.pricing?.totalAmount}`);
    });
    
    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    mongoose.disconnect();
  }
});
