export interface IScreenNameTitleMap{
    code: string,
    title:string,
    isShowTitle:boolean
}
export const ScreenNameTitleMap:Array<IScreenNameTitleMap> =[
    {
        code:'home',
        title:'Ana Sayfa',
        isShowTitle : false
    },
    {
        code:'invites',
        title:'Bildirimler',
        isShowTitle : true
    },
    {
        code:'matchDetail',
        title:'Maç Detayı',
        isShowTitle : true
    },
    {
        code:'matches',
        title:'Maçlarım',
        isShowTitle : true
    },
    {
        code:'profile',
        title:'Profilim',
        isShowTitle : true
    },
    {
        code:'createMatch',
        title:'Maç Organize Et',
        isShowTitle : true
    },
    // {
    //     code:'home',
    //     title:'Ana',
    //     isShowTitle : false
    // },
    
]