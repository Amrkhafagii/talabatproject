import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, ArrowLeft, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Card from '@/components/ui/Card';
import { supabase } from '@/utils/supabase';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/utils/validation/schemas';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setFormError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.includes('User not found')) {
          setFormError('No account found with this email address. Please check your email or sign up for a new account.');
        } else if (error.message.includes('Email rate limit exceeded')) {
          setFormError('Too many password reset requests. Please wait a few minutes before trying again.');
        } else {
          setFormError(error.message || 'An error occurred while sending the reset email. Please try again.');
        }
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    const email = getValues('email');
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (!error) {
        Alert.alert('Email Sent', 'Password reset email has been sent again.');
      } else {
        Alert.alert('Error', 'Failed to resend email. Please try again.');
      }
    } catch (err) {
      console.error('Resend email error:', err);
      Alert.alert('Error', 'Failed to resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Check Your Email" showBackButton />
        
        <View style={styles.content}>
          <Card style={styles.successCard}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color="#10B981" />
            </View>
            
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to{' '}
              <Text style={styles.emailText}>{getValues('email')}</Text>
            </Text>
            
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Next steps:</Text>
              <Text style={styles.instructionItem}>1. Check your email inbox</Text>
              <Text style={styles.instructionItem}>2. Click the reset link in the email</Text>
              <Text style={styles.instructionItem}>3. Create a new password</Text>
              <Text style={styles.instructionItem}>4. Sign in with your new password</Text>
            </View>

            <Text style={styles.noteText}>
              The reset link will expire in 1 hour for security reasons.
            </Text>
          </Card>

          <View style={styles.actionButtons}>
            <Button
              title="Resend Email"
              onPress={resendEmail}
              variant="outline"
              disabled={loading}
              style={styles.resendButton}
            />
            
            <Button
              title="Back to Sign In"
              onPress={() => router.replace('/login')}
              style={styles.backButton}
            />
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Didn't receive the email? Check your spam folder or contact support.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Reset Password" showBackButton />
      
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Mail size={48} color="#FF6B35" />
          </View>
          <Text style={styles.title}>Forgot your password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        <View style={styles.formSection}>
          {/* General form error */}
          {formError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <FormField
            control={control}
            name="email"
            label="Email Address"
            placeholder="Enter your email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Button
            title={loading ? "Sending Reset Link..." : "Send Reset Link"}
            onPress={handleSubmit(onSubmit)}
            disabled={loading || !isValid}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 For your security, password reset links expire after 1 hour and can only be used once.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 40,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 8,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B35',
  },
  securityNote: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 'auto',
    marginBottom: 20,
  },
  securityText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Success state styles
  successCard: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emailText: {
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  instructionsContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  resendButton: {
    marginBottom: 8,
  },
  backButton: {
    marginTop: 8,
  },
  helpContainer: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    padding: 12,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 16,
  },
});