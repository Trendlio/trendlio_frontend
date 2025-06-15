import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface ToastType {
  id: string;
  message: string;
  variant: 'default' | 'destructive';
}

interface ToastContextType {
  showToast: (message: string, variant?: 'default' | 'destructive') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const toastId = useRef(0);

  const showToast = (message: string, variant: 'default' | 'destructive' = 'default') => {
    const id = (toastId.current++).toString();
    setToasts((prevToasts) => [...prevToasts, { id, message, variant }]);

    setTimeout(() => {
      hideToast(id);
    }, 3000); // Auto-hide after 3 seconds
  };

  const hideToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastContainerProps {
  toasts: ToastType[];
  onHide: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onHide }) => {
  return (
    <SafeAreaView style={styles.toastContainer}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </SafeAreaView>
  );
};

interface ToastProps {
  toast: ToastType;
  onHide: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onHide(toast.id));
  };

  return (
    <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
      <Text style={styles.toastMessage}>{toast.message}</Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: Dimensions.get('window').width - 40, // Adjust width as needed
  },
  toastMessage: {
    color: '#fff',
    fontSize: 14,
    flexShrink: 1,
  },
  closeButton: {
    marginLeft: 10,
    padding: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 