import { Alert } from 'react-native';

export const show = async (title: string, message?: string): Promise<boolean> => {
    const promise = new Promise<boolean>((resolve, reject) => {
        const options: any[] = [
            { text: 'Yes', onPress: () => resolve(true)},
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
        ];

        Alert.alert(title,
            message,
            options,
            { cancelable: true },
        );
    });

    return promise;
};
