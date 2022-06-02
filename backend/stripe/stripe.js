import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_PR_KEY)

const StripeClass = {
    create(obj) {
        return stripe.checkout.sessions.create(obj)
    }
}

export default StripeClass