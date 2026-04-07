// ./server/src/controllers/stripe.controller.js
import Stripe from 'stripe';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { query } from '../config/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createStripeSession = asyncHandler(async (req, res) => {
    const { booking_id, amount } = req.body;

    if (!booking_id) {
        throw new AppError('booking_id is required', 400);
    }

    if (!amount || amount <= 0) {
        throw new AppError('Valid amount is required for payment', 400);
    }

    // Verify booking belongs to user
    const { rows } = await query(`
    SELECT b.id, b.booking_type, p.title 
    FROM bookings b 
    JOIN properties p ON b.property_id = p.id 
    WHERE b.id = $1 AND b.user_id = $2
  `, [booking_id, req.user.id]);

    if (rows.length === 0) {
        throw new AppError('Booking not found or not authorized', 404);
    }

    const booking = rows[0];

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'bdt',
                    product_data: {
                        name: booking.title || 'MoveMate Booking',
                        description: `Booking #${booking_id}`,
                    },
                    unit_amount: Math.round(amount),
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/dashboard?payment=success&booking_id=${booking_id}`,
        cancel_url: `${process.env.CLIENT_URL}/bookings/${booking_id}?payment=cancelled`,
        metadata: { booking_id: booking_id.toString() },
    });

    res.json({
        success: true,
        id: session.id,
        url: session.url,        // This is the important part
    });
});