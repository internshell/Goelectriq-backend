/**
 * Fare Calculator Utility
 * Calculates cab fare based on distance, time, cab type, and other factors
 */

/**
 * Check if current time is night hours
 */
export const isNightTime = (date = new Date()) => {
    const hour = date.getHours();
    const nightStartHour = parseInt(process.env.NIGHT_START_HOUR) || 22;
    const nightEndHour = parseInt(process.env.NIGHT_END_HOUR) || 6;
  
    return hour >= nightStartHour || hour < nightEndHour;
  };
  
  /**
   * Check if surge pricing should be applied
   */
  export const shouldApplySurge = (date = new Date()) => {
    const hour = date.getHours();
    const day = date.getDay();
  
    // Peak hours: 8-10 AM and 5-8 PM on weekdays
    const isPeakHour = 
      (hour >= 8 && hour < 10) || 
      (hour >= 17 && hour < 20);
    
    const isWeekday = day >= 1 && day <= 5;
  
    return isPeakHour && isWeekday;
  };
  
  /**
   * Calculate fare based on pricing model and ride details
   */
  export const calculateFare = (pricing, distance, scheduledDateTime, waitingMinutes = 0) => {
    // Base fare
    let fare = pricing.baseFare;
    
    // Distance charge
    const distanceCharge = distance * pricing.perKmRate;
    fare += distanceCharge;
    
    // Waiting charge
    const waitingCharge = waitingMinutes * pricing.perMinuteWaiting;
    fare += waitingCharge;
    
    // Check if night time
    const isNight = isNightTime(new Date(scheduledDateTime));
    let nightCharge = 0;
    
    if (isNight && pricing.nightCharges.enabled) {
      nightCharge = fare * (pricing.nightCharges.multiplier - 1);
      fare += nightCharge;
    }
    
    // Check if surge pricing applies
    const isSurge = shouldApplySurge(new Date(scheduledDateTime));
    let surgeCharge = 0;
    
    if (isSurge && pricing.surgeCharges.enabled) {
      surgeCharge = fare * (pricing.surgeCharges.multiplier - 1);
      fare += surgeCharge;
    }
    
    // Ensure minimum fare
    if (fare < pricing.minimumFare) {
      fare = pricing.minimumFare;
    }
    
    // Calculate GST
    const gstPercentage = pricing.gstPercentage || 5;
    const gst = fare * (gstPercentage / 100);
    
    // Total fare
    const totalFare = fare + gst;
    
    return {
      baseFare: parseFloat(pricing.baseFare.toFixed(2)),
      perKmRate: parseFloat(pricing.perKmRate.toFixed(2)),
      distanceCharge: parseFloat(distanceCharge.toFixed(2)),
      waitingCharge: parseFloat(waitingCharge.toFixed(2)),
      nightCharge: parseFloat(nightCharge.toFixed(2)),
      surgeCharge: parseFloat(surgeCharge.toFixed(2)),
      subtotal: parseFloat(fare.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      gstPercentage,
      totalFare: parseFloat(totalFare.toFixed(2)),
      discount: 0,
      isNightTime: isNight,
      isSurgeTime: isSurge,
    };
  };
  
  /**
   * Apply discount to fare
   */
  export const applyDiscount = (fareBreakdown, discountPercentage = 0, discountAmount = 0) => {
    let discount = 0;
    
    if (discountPercentage > 0) {
      discount = fareBreakdown.subtotal * (discountPercentage / 100);
    } else if (discountAmount > 0) {
      discount = discountAmount;
    }
    
    // Ensure discount doesn't exceed subtotal
    if (discount > fareBreakdown.subtotal) {
      discount = fareBreakdown.subtotal;
    }
    
    const newSubtotal = fareBreakdown.subtotal - discount;
    const newGst = newSubtotal * (fareBreakdown.gstPercentage / 100);
    const newTotalFare = newSubtotal + newGst;
    
    return {
      ...fareBreakdown,
      discount: parseFloat(discount.toFixed(2)),
      subtotal: parseFloat(newSubtotal.toFixed(2)),
      gst: parseFloat(newGst.toFixed(2)),
      totalFare: parseFloat(newTotalFare.toFixed(2)),
    };
  };
  
  /**
   * Calculate cancellation charges
   */
  export const calculateCancellationCharges = (booking) => {
    const scheduledTime = new Date(booking.scheduledDate);
    const now = new Date();
    const hoursUntilRide = (scheduledTime - now) / (1000 * 60 * 60);
    
    let cancellationPercentage = 0;
    
    if (hoursUntilRide < 1) {
      // Less than 1 hour: 100% charge
      cancellationPercentage = 100;
    } else if (hoursUntilRide < 3) {
      // 1-3 hours: 50% charge
      cancellationPercentage = 50;
    } else if (hoursUntilRide < 6) {
      // 3-6 hours: 25% charge
      cancellationPercentage = 25;
    } else {
      // More than 6 hours: Free cancellation
      cancellationPercentage = 0;
    }
    
    const cancellationCharge = (booking.pricing.totalFare * cancellationPercentage) / 100;
    const refundAmount = booking.pricing.totalFare - cancellationCharge;
    
    return {
      cancellationPercentage,
      cancellationCharge: parseFloat(cancellationCharge.toFixed(2)),
      refundAmount: parseFloat(refundAmount.toFixed(2)),
      hoursUntilRide: parseFloat(hoursUntilRide.toFixed(2)),
    };
  };
  
  /**
   * Estimate ride duration based on distance
   */
  export const estimateRideDuration = (distance) => {
    // Assuming average speed of 30 km/h in city traffic
    const avgSpeed = 30;
    const duration = (distance / avgSpeed) * 60; // in minutes
    
    return Math.ceil(duration);
  };
  
  /**
   * Get pricing tier based on distance
   */
  export const getPricingTier = (distance) => {
    if (distance <= 5) return 'short';
    if (distance <= 20) return 'medium';
    if (distance <= 50) return 'long';
    return 'outstation';
  };
  
  /**
   * Calculate driver earnings from a ride
   */
  export const calculateDriverEarnings = (totalFare, commissionPercentage = 20) => {
    const commission = totalFare * (commissionPercentage / 100);
    const driverEarning = totalFare - commission;
    
    return {
      totalFare: parseFloat(totalFare.toFixed(2)),
      commission: parseFloat(commission.toFixed(2)),
      commissionPercentage,
      driverEarning: parseFloat(driverEarning.toFixed(2)),
    };
  };
  
  export default {
    calculateFare,
    applyDiscount,
    calculateCancellationCharges,
    calculateDriverEarnings,
    estimateRideDuration,
    getPricingTier,
    isNightTime,
    shouldApplySurge,
  };