import mongoose from 'mongoose';
import Pricing from '../models/Pricing.js';

// Delete the mini car from database
const deleteMineCar = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goelectriq');
    
    console.log('🔍 Looking for mini car...');
    
    // Find and delete the mini car
    const result = await Pricing.deleteOne({ cabType: 'mini' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Mini car deleted successfully!');
      console.log('Deleted document count:', result.deletedCount);
    } else {
      console.log('⚠️ No mini car found to delete');
    }
    
    // Show remaining cars
    const remaining = await Pricing.find({});
    console.log('\n📋 Remaining cars in database:');
    remaining.forEach(car => {
      console.log(`  - ${car.cabType}: ${car.displayName}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error deleting mini car:', error);
    process.exit(1);
  }
};

deleteMineCar();
