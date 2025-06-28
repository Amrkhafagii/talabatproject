import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import FormToggle from '@/components/ui/FormToggle';
import { loginSchema, LoginFormData } from '@/utils/validation/schemas';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const { signIn } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true, // Default to true for better UX
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError('');
    setLoading(true);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        // Handle specific error types with user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          setFormError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setFormError('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('Too many requests')) {
          setFormError('Too many login attempts. Please wait a moment before trying again.');
        } else if (error.message.includes('User not found')) {
          setFormError('No account found with this email address. Please sign up first.');
        } else {
          setFormError(error.message || 'An error occurred during sign in. Please try again.');
        }
      } else {
        // Note: Supabase automatically handles session persistence
        // The "Remember Me" checkbox is primarily for user reassurance
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Login error:', err);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = () => {
    if (formError) {
      setFormError('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Welcome Back" showBackButton />
      
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Sign in to your account</Text>
          <Text style={styles.welcomeSubtitle}>
            Enter your credentials to access your account
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
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.inputContainer}
          />

          <FormField
            control={control}
            name="password"
            label="Password"
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            style={styles.inputContainer}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            }
          />

          {/* Remember Me Toggle */}
          <FormToggle
            control={control}
            name="rememberMe"
            label="Remember me"
            description="Keep me signed in on this device"
            style={styles.rememberMeContainer}
          />

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title={loading ? "Signing In..." : "Sign In"}
            onPress={handleSubmit(onSubmit)}
            disabled={loading || !isValid}
            style={styles.signInButton}
          />
        </View>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionInfoText}>
            🔒 Your session will be securely maintained across app restarts for your convenience.
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
  welcomeSection: {
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
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
  inputContainer: {
    marginBottom: 16,
  },
  rememberMeContainer: {
    marginBottom: 16,
    marginTop: -4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FF6B35',
  },
  signInButton: {
    marginBottom: 24,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B35',
  },
  sessionInfo: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 'auto',
    marginBottom: 20,
  },
  sessionInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
    textAlign: 'center',
    lineHeight: 16,
  },
});