import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Store, Truck, Eye, EyeOff } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import UserTypeSelector from '@/components/ui/UserTypeSelector';
import { signupSchema, SignupFormData } from '@/utils/validation/schemas';

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const { signUp } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'customer',
    },
  });

  const selectedUserType = watch('userType');

  const onSubmit = async (data: SignupFormData) => {
    setFormError('');
    setLoading(true);

    try {
      const { error } = await signUp(data.email, data.password, data.userType);

      if (error) {
        // Handle specific error types
        if (error.message.includes('User already registered')) {
          setFormError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          setFormError('Password must be at least 6 characters long.');
        } else if (error.message.includes('Invalid email')) {
          setFormError('Please enter a valid email address.');
        } else {
          setFormError(error.message || 'An error occurred during sign up. Please try again.');
        }
      } else {
        Alert.alert(
          'Success',
          'Account created successfully! Please check your email to verify your account.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (err) {
      console.error('Signup error:', err);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeSelect = (userType: 'customer' | 'restaurant' | 'delivery') => {
    setValue('userType', userType);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Create Account" showBackButton />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.content}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Join FoodieExpress</Text>
              <Text style={styles.welcomeSubtitle}>
                Create your account to get started
              </Text>
            </View>

            {/* General form error */}
            {formError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            {/* User Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>I want to</Text>
              <UserTypeSelector
                selectedType={selectedUserType}
                onSelect={handleUserTypeSelect}
              />
            </View>

            {/* Account Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              
              <FormField
                control={control}
                name="email"
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <FormField
                control={control}
                name="password"
                label="Password"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
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

              <FormField
                control={control}
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                rightElement={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                }
              />
            </View>

            <Button
              title={loading ? "Creating Account..." : "Create Account"}
              onPress={handleSubmit(onSubmit)}
              disabled={loading || !isValid}
              style={styles.signUpButton}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    minHeight: '100%',
  },
  welcomeSection: {
    marginBottom: 32,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  signUpButton: {
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loginText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B35',
  },
});