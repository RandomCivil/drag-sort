require(['avalon-min'],function(avalon){
		var drag_proxy=avalon.define({//拖动代理
			$id:'drag_proxy',
			select_num:0,
			src:''
		}),isIE =!-[1,];
		var photo_sort=avalon.define({
			$id:'photo_sort',
			photo_list:[],//图片列表
			selected_index:[],//选中图片的index列表
			selected_photo:[],
			drag_flag:false,
			sort_array:[],//范围列表,
			cell_size:0,//每个单元格尺寸，这里宽高比为1
			target_index:-1,//最终目标位置的index
			col_num:0,//列数
			x_index:-1,//当前拖动位置的x方向index
			select:function(i){
				var selected_index=photo_sort.selected_index,selected_photo=photo_sort.selected_photo,
				photo=photo_sort.photo_list[i].$model.src;
				if(selected_photo.indexOf(photo)==-1){//选中图片的index列表不存在，添加
					selected_index.ensure(i);
					selected_photo.ensure(photo);
				}else{
					selected_index.remove(i);
					selected_photo.remove(photo);
				}
			},
			start_drag:function(e,index){
				if(photo_sort.selected_index.size()){//有选中的图片
					photo_sort.target_index=index;//避免用户没有拖动图片，但点击了图片，设置默认目标即当前点击图片
					photo_sort.cell_size=this.clientWidth;
					var xx=e.clientX-photo_sort.cell_size/2,yy=e.clientY-photo_sort.cell_size/2;//点下图片，设置代理位置以点击点为中心
					$('drag_proxy').style.top=yy+avalon(window).scrollTop()+'px';
					$('drag_proxy').style.left=xx+'px';
					$('drag_proxy').style.width=photo_sort.cell_size+'px';
					$('drag_proxy').style.height=photo_sort.cell_size+'px';
					drag_proxy.select_num=photo_sort.selected_index.length;//设置代理中选择图片的数量
					if(drag_proxy.select_num>0){
						var drag_img=photo_sort.photo_list[photo_sort.selected_index[drag_proxy.select_num-1]];
						drag_proxy.src=drag_img.src;//将选中的图片中最后一张作为代理对象的"封面"
						photo_sort.drag_flag=true;
						$('drag_proxy').style.display='block';
					}
					//cell_gap:图片间间距,first_gap:第一张图片和外部div间间距
					var wrap_width=avalon($('wrap')).width(),wrap_offset=$('wrap').offsetLeft,first_left=$('wrap_photo0').offsetLeft,
					second_left=$('wrap_photo1').offsetLeft,first_gap=first_left-wrap_offset,cell_gap=second_left-first_left;
					photo_sort.col_num=Math.round((wrap_width-2*first_gap+(cell_gap-photo_sort.cell_size))/cell_gap);
					for(var i=0;i<photo_sort.col_num;i++)//把一行图片里的每张图片中心坐标x方向的值作为分割点，添加到范围列表
						photo_sort.sort_array.push(first_gap+cell_gap*i+photo_sort.cell_size/2);
					var target=this.parentNode;
					avalon.bind(document,'mouseup',function(e){
						onMouseUp(target);
					});
					if(isIE)
						target.setCapture();
					e.stopPropagation();
					e.preventDefault();
				}
			},
			drag_move:function(e){
				if(photo_sort.drag_flag){
					var xx=e.clientX,yy=e.clientY,offset=avalon($('wrap')).offset();
					var offsetX=xx-offset.left,offsetY=yy-offset.top;
					photo_sort.sort_array.push(offsetX);//把当前鼠标位置添加的范围列表
					photo_sort.sort_array.sort(function(a,b){//对范围列表排序
						return parseInt(a)-parseInt(b);//转为数值类型,否则会出现'1234'<'333'
					});
					//从已排序的范围列表中找出当前鼠标位置的index,即目标位置水平方向的index
					var x_index=photo_sort.sort_array.indexOf(offsetX),y_index=Math.floor(offsetY/(photo_sort.cell_size+20)),
					size=photo_sort.photo_list.size();
					photo_sort.x_index=x_index;
					photo_sort.target_index=photo_sort.col_num*y_index+x_index;//目标在所有图片中的index
					if(photo_sort.target_index>size)//目标位置越界
						photo_sort.target_index=size;
					photo_sort.sort_array.remove(offsetX);//移除当前位置
					$('drag_proxy').style.top=avalon(window).scrollTop()+yy-photo_sort.cell_size/2+'px';
					$('drag_proxy').style.left=xx-photo_sort.cell_size/2+'px';
				}
				e.stopPropagation();
			}
		});
		function onMouseUp(target){
			if(photo_sort.drag_flag){
				// photo_sort.selected_index.sort();
				var size=photo_sort.selected_index.size();
				var data=photo_sort.photo_list,target_index=photo_sort.target_index,pos_arr=photo_sort.selected_index.$model;
				pos_arr.push(target_index);//pos_arr存放选中的目标图片+目标位置，并排好序
				pos_arr.sort(function(a,b){//对范围列表排序
					return parseInt(a)-parseInt(b);
				});
				var target_pos=pos_arr.indexOf(target_index),temp;
				//目标位置在选中图片之后,从目标位置开始，依次向前遍历目标图片
				for(var i=target_pos-1;i>=0;i--){
					var item_index=pos_arr[i];
					temp=data[item_index].$model;
					for(var j=item_index;j<target_index;j++){
						data[j].$model=data[j+1].$model;
					}
					data[target_index-1].$model=temp;
				}
				//目标位置在选中图片之前,从目标位置开始，依次向后遍历目标图片
				for(var i=target_pos+1;i<pos_arr.length;i++){
					var item_index=pos_arr[i];
					temp=data[item_index].$model;
					for(var j=item_index;j>target_index;j--)
						data[j].$model=data[j-1].$model;
					data[target_index].$model=temp;
				}
				photo_sort.photo_list=data;//更新数据
				photo_sort.target_index=-1;//各种重置，初始化
				photo_sort.sort_array=[];
				photo_sort.col_num=0;
				photo_sort.x_index=-1;
				photo_sort.selected_photo.clear();
				photo_sort.selected_index.clear();
				$('drag_proxy').style.display='none';
				photo_sort.drag_flag=false;
				avalon.unbind(document,'mouseup');
				if(isIE)
					target.releaseCapture();
			}
		}
		for(var i=1;i<16;i++)
			photo_sort.photo_list.push({src:i+'.jpg'});
		avalon.scan();
});