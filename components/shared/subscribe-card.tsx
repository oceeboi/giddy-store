import { useSubscribeStore } from '@/store/subscribe.store';

export function SubscribeCard() {
  const { email, isSubscribed, addEmail, removeEmail } = useSubscribeStore();

  const handleSubscribe = () => {
    if (email.trim() !== '') {
      addEmail(email);
    }
  };

  const handleUnsubscribe = () => {
    // send to backend to database for newsletter subscription management
    removeEmail();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2>Subscribe to our Newsletter</h2>
      {isSubscribed ? (
        <div>
          <p>Thank you for subscribing!</p>
          <button onClick={handleUnsubscribe}>Unsubscribe</button>
        </div>
      ) : (
        <div>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => addEmail(e.target.value)}
          />
          <button onClick={handleSubscribe}>Subscribe</button>
        </div>
      )}
    </div>
  );
}
