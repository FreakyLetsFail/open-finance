/**
 * Registration Page
 * Secure user registration with validation and email verification
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/types/validation';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    const result = await signUp({
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      phone: data.phone,
    });

    if (result.success) {
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } else {
      setError(result.error?.message || 'Registrierung fehlgeschlagen');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Registrierung erfolgreich!
            </h2>
            <p className="mt-2 text-gray-600">
              Bitte überprüfen Sie Ihre E-Mail-Adresse, um Ihr Konto zu
              bestätigen.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Sie werden automatisch zur Anmeldeseite weitergeleitet...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Konto erstellen
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Für Ihre Vereinsfinanzverwaltung
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700"
              >
                Vollständiger Name
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                {...register('full_name')}
                className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                  errors.full_name ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Max Mustermann"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="max@beispiel.de"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Telefonnummer (optional)
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                {...register('phone')}
                className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="+49 123 456789"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Mindestens 12 Zeichen"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Muss Groß-/Kleinbuchstaben, Ziffern und Sonderzeichen enthalten
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="password_confirm"
                className="block text-sm font-medium text-gray-700"
              >
                Passwort bestätigen
              </label>
              <input
                id="password_confirm"
                type="password"
                autoComplete="new-password"
                {...register('password_confirm')}
                className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                  errors.password_confirm ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Passwort wiederholen"
              />
              {errors.password_confirm && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password_confirm.message}
                </p>
              )}
            </div>

            {/* Terms & Privacy */}
            <div className="space-y-2">
              <div className="flex items-start">
                <input
                  id="terms_accepted"
                  type="checkbox"
                  {...register('terms_accepted')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                />
                <label
                  htmlFor="terms_accepted"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Ich akzeptiere die{' '}
                  <Link
                    href="/terms"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Nutzungsbedingungen
                  </Link>
                </label>
              </div>
              {errors.terms_accepted && (
                <p className="ml-6 text-sm text-red-600">
                  {errors.terms_accepted.message}
                </p>
              )}

              <div className="flex items-start">
                <input
                  id="privacy_accepted"
                  type="checkbox"
                  {...register('privacy_accepted')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                />
                <label
                  htmlFor="privacy_accepted"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Ich akzeptiere die{' '}
                  <Link
                    href="/privacy"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Datenschutzerklärung
                  </Link>
                </label>
              </div>
              {errors.privacy_accepted && (
                <p className="ml-6 text-sm text-red-600">
                  {errors.privacy_accepted.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Wird registriert...
                </span>
              ) : (
                'Registrieren'
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Bereits registriert?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
