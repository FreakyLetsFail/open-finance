/**
 * Two-Factor Authentication Setup Component
 * UI for enabling and managing 2FA
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  twoFactorVerifySchema,
  type TwoFactorVerifyInput,
} from '@/types/validation';
import Image from 'next/image';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'scan' | 'verify' | 'backup'>('scan');
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorVerifyInput>({
    resolver: zodResolver(twoFactorVerifySchema),
  });

  // Initialize 2FA setup
  const initializeTwoFactor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setQrCode(data.data.qr_code);
        setStep('scan');
      } else {
        setError(data.error?.message || 'Fehler beim Einrichten von 2FA');
      }
    } catch (err) {
      setError('Netzwerkfehler beim Einrichten von 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 2FA code
  const onVerify = async (data: TwoFactorVerifyInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: data.code }),
      });

      const result = await response.json();

      if (result.success) {
        setBackupCodes(result.data.backup_codes);
        setStep('backup');
      } else {
        setError(result.error?.message || 'Ungültiger Code');
      }
    } catch (err) {
      setError('Netzwerkfehler bei der Verifizierung');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete setup
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'scan') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Zwei-Faktor-Authentifizierung einrichten
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Scannen Sie den QR-Code mit Ihrer Authenticator-App
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {qrCode ? (
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow">
              <Image
                src={qrCode}
                alt="QR Code für 2FA"
                width={256}
                height={256}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={initializeTwoFactor}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Lädt...' : 'QR-Code generieren'}
            </button>
          </div>
        )}

        {qrCode && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Empfohlene Apps: Google Authenticator, Authy, Microsoft
              Authenticator
            </p>
            <button
              onClick={() => setStep('verify')}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Code scannen und weiter
            </button>
          </div>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full text-sm text-gray-600 hover:text-gray-900"
          >
            Abbrechen
          </button>
        )}
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Code verifizieren
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onVerify)} className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              Authentifizierungscode
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              {...register('code')}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.code ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-2xl tracking-widest`}
              placeholder="000000"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Verifiziert...' : 'Code verifizieren'}
          </button>
        </form>

        <button
          onClick={() => setStep('scan')}
          className="w-full text-sm text-gray-600 hover:text-gray-900"
        >
          Zurück
        </button>
      </div>
    );
  }

  if (step === 'backup') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Backup-Codes speichern
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Bewahren Sie diese Codes sicher auf. Sie können jeden Code nur einmal
            verwenden.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="bg-white px-3 py-2 rounded border border-gray-200 font-mono text-sm text-center"
              >
                {code}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={downloadBackupCodes}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Codes herunterladen
          </button>

          <button
            onClick={handleComplete}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Einrichtung abschließen
          </button>
        </div>

        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Wichtig: Speichern Sie diese Codes an einem sicheren Ort. Wenn Sie
                Ihr Gerät verlieren, benötigen Sie einen dieser Codes für die
                Anmeldung.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
