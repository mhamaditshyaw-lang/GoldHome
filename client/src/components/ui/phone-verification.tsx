import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, MessageCircle, Shield, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface PhoneVerificationProps {
  phone: string;
  onVerificationComplete: (verificationCode: string) => void;
  isLoading?: boolean;
  direction?: 'ltr' | 'rtl';
}

export default function PhoneVerification({ 
  phone, 
  onVerificationComplete, 
  isLoading = false,
  direction = 'ltr' 
}: PhoneVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { toast } = useToast();

  const sendVerificationCode = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/phone-verification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCodeSent(true);
        setTimeLeft(600); // 10 minutes countdown
        
        // Start countdown timer
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast({
          title: 'Verification Code Sent',
          description: `Code sent to ${phone}`,
        });

        // For development - show code in console
        if (data.tempCode) {
          console.log('Verification code:', data.tempCode);
          if (data.tempCode) {
            toast({
              title: 'Development Mode',
              description: `Verification code: ${data.tempCode}`,
              variant: 'default',
            });
          }
        }
      } else {
        toast({
          title: 'Failed to Send Code',
          description: data.message || 'Please try again',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Verifying code:', verificationCode, 'for phone:', phone);
      
      const response = await fetch('/api/phone-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phone.trim(), 
          code: verificationCode.trim() 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Phone Verified',
          description: 'Your phone number has been verified successfully',
        });
        onVerificationComplete(verificationCode);
      } else {
        console.error('Verification failed:', data);
        let errorMessage = 'Invalid verification code';
        
        if (data.message) {
          if (data.message.includes('expired')) {
            errorMessage = 'Verification code has expired. Please request a new code.';
          } else if (data.message.includes('Invalid')) {
            errorMessage = 'Please check the code and try again.';
          } else {
            errorMessage = data.message;
          }
        }
        
        toast({
          title: 'Verification Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify code. Please check your connection and try again.',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resendCode = () => {
    if (timeLeft > 0) return;
    setCodeSent(false);
    setVerificationCode('');
    sendVerificationCode();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Phone Verification</h3>
          <p className="text-sm text-gray-600">Verify your phone number to continue</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <Phone className="w-4 h-4" />
          <span>Phone: {phone}</span>
        </div>

        {!codeSent ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-600">
              Click the button below to receive a verification code via SMS or WhatsApp
            </p>
            <Button
              onClick={sendVerificationCode}
              disabled={sending}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {sending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                </motion.div>
              ) : (
                <MessageCircle className="w-4 h-4 mr-2" />
              )}
              {sending ? 'Sending Code...' : 'Send Verification Code'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verification code sent to {phone}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter 6-digit verification code</Label>
              <motion.div 
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Input
                  id="verification-code"
                  type="tel"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className={`text-center text-xl font-mono tracking-widest ${direction === 'rtl' ? 'text-right' : 'text-left'} transition-all duration-300 focus:shadow-lg focus:shadow-yellow-200/50 focus:border-yellow-400`}
                  placeholder="000000"
                  disabled={isLoading}
                />
              </motion.div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'Code expired'}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={resendCode}
                disabled={timeLeft > 0 || sending}
                className="text-yellow-600 hover:text-yellow-700"
              >
                {timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend Code'}
              </Button>
            </div>

            <Button
              onClick={verifyCode}
              disabled={verificationCode.length !== 6 || isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isLoading ? 'Verifying...' : 'Verify Phone Number'}
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {codeSent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Check your phone</p>
                <p>We've sent a 6-digit verification code to your phone via SMS or WhatsApp. Enter the code above to verify your phone number.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}