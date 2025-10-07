import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home } from 'lucide-react-native';
import globalStyles from '../../src/styles/globalStyle';

interface IPageHeaderProps {
    title:string;
    onPressMenuButton: (screenName:string) => void;
}

export const PageHeader: React.FC<IPageHeaderProps> = ({title, onPressMenuButton}) => {
    
    return (
        <View style={globalStyles.pageHeader} >
            <TouchableOpacity
                onPress={() => onPressMenuButton('home')}
                style={globalStyles.headerButton}
            >
                <Home color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={globalStyles.headerTitle}>{title}</Text>
        </View >
    );
}