import { Alert } from 'react-native';

export const show = async (text: string): Promise<boolean> => {
    const promise = new Promise<boolean>((resolve, reject) => {
        const options: any[] = [
            { text: 'Yes', onPress: () => resolve(true)},
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
        ];

        Alert.alert(text,
            undefined,
            options,
            { cancelable: true },
        );
    });

    return promise;
};
